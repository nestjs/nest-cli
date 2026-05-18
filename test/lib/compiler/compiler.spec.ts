import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Compiler } from '../../../lib/compiler/compiler.js';
import { TsConfigProvider } from '../../../lib/compiler/helpers/tsconfig-provider.js';
import { PluginsLoader } from '../../../lib/compiler/plugins/plugins-loader.js';
import { TypeScriptBinaryLoader } from '../../../lib/compiler/typescript-loader.js';
import { Configuration } from '../../../lib/configuration/index.js';

const ProcessExitError = class extends Error {
  constructor(public code: number | undefined) {
    super(`process.exit(${code})`);
  }
};

const makeConfiguration = (): Required<Configuration> =>
  ({
    language: 'ts',
    sourceRoot: 'src',
    collection: '@nestjs/schematics',
    entryFile: 'main',
    exec: 'node',
    projects: {},
    monorepo: false,
    compilerOptions: {},
    generateOptions: {},
  }) as Required<Configuration>;

interface BuiltCompiler {
  compiler: Compiler;
  emitMock: ReturnType<typeof vi.fn>;
  diagnosticsMock: ReturnType<typeof vi.fn>;
  formatDiagnosticsMock: ReturnType<typeof vi.fn>;
  pluginsLoader: PluginsLoader;
}

const buildCompiler = ({
  diagnostics = [],
  emitDiagnostics = [],
  incremental = false,
}: {
  diagnostics?: unknown[];
  emitDiagnostics?: unknown[];
  incremental?: boolean;
} = {}): BuiltCompiler => {
  const emitMock = vi.fn().mockReturnValue({ diagnostics: emitDiagnostics });
  const fakeProgram = incremental
    ? { getProgram: () => ({ __ref: true }), emit: emitMock }
    : { emit: emitMock };

  const formatDiagnosticsMock = vi.fn().mockReturnValue('<formatted>');
  const getPreEmitDiagnosticsMock = vi
    .fn()
    .mockReturnValue(diagnostics as never[]);

  const fakeTs = {
    sys: {
      getCurrentDirectory: () => process.cwd(),
      newLine: '\n',
    },
    createProgram: incremental ? undefined : vi.fn(() => fakeProgram),
    createIncrementalProgram: incremental ? vi.fn(() => fakeProgram) : undefined,
    getPreEmitDiagnostics: getPreEmitDiagnosticsMock,
    formatDiagnosticsWithColorAndContext: formatDiagnosticsMock,
  } as any;

  const typescriptLoader = {
    load: vi.fn().mockReturnValue(fakeTs),
  } as unknown as TypeScriptBinaryLoader;

  const tsConfigProvider = {
    getByConfigFilename: vi.fn().mockReturnValue({
      options: { outDir: 'dist' },
      fileNames: ['src/main.ts'],
      projectReferences: undefined,
    }),
  } as unknown as TsConfigProvider;

  const pluginsLoader = {
    load: vi.fn().mockReturnValue({
      beforeHooks: [],
      afterHooks: [],
      afterDeclarationsHooks: [],
      readonlyVisitors: [],
    }),
  } as unknown as PluginsLoader;

  const compiler = new Compiler(
    pluginsLoader,
    tsConfigProvider,
    typescriptLoader,
  );

  return {
    compiler,
    emitMock,
    diagnosticsMock: getPreEmitDiagnosticsMock,
    formatDiagnosticsMock,
    pluginsLoader,
  };
};

describe('Compiler', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new ProcessExitError(code);
    }) as never);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it('invokes onSuccess and emits when there are no diagnostics', () => {
    const { compiler, emitMock } = buildCompiler();
    const onSuccess = vi.fn();

    compiler.run(makeConfiguration(), 'tsconfig.json', undefined, {}, onSuccess);

    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('falls back to createProgram when createIncrementalProgram is unavailable', () => {
    const built = buildCompiler({ incremental: false });

    built.compiler.run(
      makeConfiguration(),
      'tsconfig.json',
      undefined,
      {},
      vi.fn(),
    );

    expect(built.emitMock).toHaveBeenCalledTimes(1);
  });

  it('uses createIncrementalProgram when the loaded TypeScript exposes it', () => {
    const built = buildCompiler({ incremental: true });

    built.compiler.run(
      makeConfiguration(),
      'tsconfig.json',
      undefined,
      {},
      vi.fn(),
    );

    expect(built.emitMock).toHaveBeenCalledTimes(1);
  });

  it('exits with code 1 and prints diagnostics when pre-emit diagnostics exist', () => {
    const { compiler } = buildCompiler({
      diagnostics: [{ messageText: 'fake diagnostic' }],
    });
    const onSuccess = vi.fn();

    expect(() =>
      compiler.run(makeConfiguration(), 'tsconfig.json', undefined, {}, onSuccess),
    ).toThrow(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Found 1 error'),
    );
  });

  it('exits with code 1 when emit returns diagnostics', () => {
    const { compiler } = buildCompiler({
      emitDiagnostics: [{ messageText: 'emit error' }],
    });

    expect(() =>
      compiler.run(makeConfiguration(), 'tsconfig.json', undefined, {}),
    ).toThrow(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('runs without onSuccess and still emits cleanly', () => {
    const { compiler, emitMock } = buildCompiler();

    compiler.run(makeConfiguration(), 'tsconfig.json', undefined, {});

    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
