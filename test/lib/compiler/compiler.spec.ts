import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Compiler } from '../../../lib/compiler/compiler.js';
import { Configuration } from '../../../lib/configuration/index.js';

vi.mock('../../../lib/compiler/hooks/tsconfig-paths.hook.js', () => ({
  tsconfigPathsBeforeHookFactory: vi.fn(() => undefined),
}));

import { tsconfigPathsBeforeHookFactory } from '../../../lib/compiler/hooks/tsconfig-paths.hook.js';

describe('Compiler (tsc)', () => {
  const configuration = {
    sourceRoot: 'src',
    compilerOptions: { plugins: [] },
  } as unknown as Required<Configuration>;

  let emit: ReturnType<typeof vi.fn>;
  let program: Record<string, any>;
  let tsBinary: Record<string, any>;
  let pluginsLoader: any;
  let tsConfigProvider: any;
  let typescriptLoader: any;
  let compiler: Compiler;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  const buildCompiler = (diagnostics: unknown[] = []) => {
    emit = vi.fn().mockReturnValue({ diagnostics: [] });
    program = {
      emit,
      getProgram: vi.fn(() => ({ __program: true })),
    };

    tsBinary = {
      sys: { getCurrentDirectory: () => '/project', newLine: '\n' },
      createIncrementalProgram: vi.fn(() => program),
      createProgram: vi.fn(() => program),
      getPreEmitDiagnostics: vi.fn(() => diagnostics),
      formatDiagnosticsWithColorAndContext: vi.fn(
        () => 'formatted diagnostics',
      ),
    };

    pluginsLoader = {
      load: vi.fn(() => ({
        beforeHooks: [],
        afterHooks: [],
        afterDeclarationsHooks: [],
      })),
    };
    tsConfigProvider = {
      getByConfigFilename: vi.fn(() => ({
        options: { outDir: 'dist' },
        fileNames: ['/project/src/main.ts'],
        projectReferences: undefined,
      })),
    };
    typescriptLoader = { load: vi.fn(() => tsBinary) };

    return new Compiler(pluginsLoader, tsConfigProvider, typescriptLoader);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tsconfigPathsBeforeHookFactory).mockReturnValue(undefined);
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    compiler = buildCompiler();
  });

  it('reads the compilation inputs from the given tsconfig path', () => {
    compiler.run(configuration, 'tsconfig.build.json', undefined, undefined);

    expect(tsConfigProvider.getByConfigFilename).toHaveBeenCalledWith(
      'tsconfig.build.json',
    );
  });

  it('creates the program from the parsed file names and options', () => {
    compiler.run(configuration, 'tsconfig.json', undefined, undefined);

    expect(tsBinary.createIncrementalProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        rootNames: ['/project/src/main.ts'],
        options: { outDir: 'dist' },
      }),
    );
  });

  it('falls back to createProgram when incremental programs are unavailable', () => {
    tsBinary.createIncrementalProgram = undefined;

    compiler.run(configuration, 'tsconfig.json', undefined, undefined);

    expect(tsBinary.createProgram).toHaveBeenCalled();
    expect(emit).toHaveBeenCalled();
  });

  it('emits and calls onSuccess when there are no diagnostics', () => {
    const onSuccess = vi.fn();

    compiler.run(
      configuration,
      'tsconfig.json',
      undefined,
      undefined,
      onSuccess,
    );

    expect(emit).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does not throw when no onSuccess callback is supplied', () => {
    expect(() =>
      compiler.run(configuration, 'tsconfig.json', undefined, undefined),
    ).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with code 1 and skips onSuccess when diagnostics are reported', () => {
    compiler = buildCompiler([{ messageText: 'Type error' }]);
    const onSuccess = vi.fn();

    compiler.run(
      configuration,
      'tsconfig.json',
      undefined,
      undefined,
      onSuccess,
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(tsBinary.formatDiagnosticsWithColorAndContext).toHaveBeenCalled();
  });

  it('reports diagnostics produced by the emit itself', () => {
    emit.mockReturnValue({ diagnostics: [{ messageText: 'Emit error' }] });
    const onSuccess = vi.fn();

    compiler.run(
      configuration,
      'tsconfig.json',
      undefined,
      undefined,
      onSuccess,
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('passes the loaded plugin hooks to the emit transformers', () => {
    const beforeHook = vi.fn(() => 'before-transformer');
    const afterHook = vi.fn(() => 'after-transformer');
    const afterDeclarationsHook = vi.fn(() => 'after-declarations-transformer');
    pluginsLoader.load.mockReturnValue({
      beforeHooks: [beforeHook],
      afterHooks: [afterHook],
      afterDeclarationsHooks: [afterDeclarationsHook],
    });

    compiler.run(configuration, 'tsconfig.json', undefined, undefined);

    // Hooks are instantiated with the resolved ts.Program, not the builder.
    expect(beforeHook).toHaveBeenCalledWith({ __program: true });
    const transformers = emit.mock.calls[0][4];
    expect(transformers.before).toEqual(['before-transformer']);
    expect(transformers.after).toEqual(['after-transformer']);
    expect(transformers.afterDeclarations).toEqual([
      'after-declarations-transformer',
    ]);
  });

  it('prepends the tsconfig-paths transformer when path aliases are configured', () => {
    vi.mocked(tsconfigPathsBeforeHookFactory).mockReturnValue(
      'paths-transformer' as any,
    );
    pluginsLoader.load.mockReturnValue({
      beforeHooks: [() => 'before-transformer'],
      afterHooks: [],
      afterDeclarationsHooks: [],
    });

    compiler.run(configuration, 'tsconfig.json', undefined, undefined);

    const transformers = emit.mock.calls[0][4];
    expect(transformers.before).toEqual([
      'paths-transformer',
      'before-transformer',
    ]);
    expect(transformers.afterDeclarations).toEqual(['paths-transformer']);
  });

  it('uses the builder program directly when getProgram is unavailable', () => {
    program.getProgram = undefined;
    const beforeHook = vi.fn(() => 'before-transformer');
    pluginsLoader.load.mockReturnValue({
      beforeHooks: [beforeHook],
      afterHooks: [],
      afterDeclarationsHooks: [],
    });

    compiler.run(configuration, 'tsconfig.json', undefined, undefined);

    expect(beforeHook).toHaveBeenCalledWith(program);
  });
});
