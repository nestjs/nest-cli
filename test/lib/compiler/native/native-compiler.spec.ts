import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeCompiler } from '../../../../lib/compiler/native/native-compiler.js';
import { Configuration } from '../../../../lib/configuration/index.js';
import { CLI_ERRORS } from '../../../../lib/ui/index.js';

const ERROR = 1;
const WARNING = 0;

describe('NativeCompiler (tsc builder on TypeScript 7.1+)', () => {
  const configuration = {
    sourceRoot: 'src',
    compilerOptions: { plugins: [] },
  } as unknown as Required<Configuration>;

  let program: Record<string, any>;
  let api: Record<string, any>;
  let nativeModule: Record<string, any>;
  let typescriptLoader: Record<string, any>;
  let tsConfigProvider: Record<string, any>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  const buildCompiler = (
    diagnostics: Partial<Record<string, unknown[]>> = {},
    options: Record<string, unknown> = { outDir: 'dist' },
  ) => {
    program = {
      emit: vi.fn(() => ({
        emitSkipped: false,
        diagnostics: diagnostics.emit ?? [],
        emittedFiles: ['/project/dist/main.js'],
      })),
      getGlobalDiagnostics: vi.fn(() => diagnostics.global ?? []),
      getSyntacticDiagnostics: vi.fn(() => diagnostics.syntactic ?? []),
      getBindDiagnostics: vi.fn(() => diagnostics.bind ?? []),
      getSemanticDiagnostics: vi.fn(() => diagnostics.semantic ?? []),
      getDeclarationDiagnostics: vi.fn(() => diagnostics.declaration ?? []),
      dispose: vi.fn(),
      getCurrentDirectory: () => '/project',
      getCanonicalFileName: (f: string) => f,
      getNewLine: () => '\n',
    };
    api = { createProgram: vi.fn(() => program) };
    nativeModule = {
      API: vi.fn(),
      DiagnosticCategory: { Warning: WARNING, Error: ERROR },
      formatDiagnosticsWithColorAndContext: vi.fn(() => 'formatted'),
    };
    typescriptLoader = {
      getNativeModule: vi.fn(() => nativeModule),
      loadNativeApi: vi.fn(() => api),
      closeNativeApi: vi.fn(),
    };
    tsConfigProvider = {
      getByConfigFilename: vi.fn(() => ({
        options,
        fileNames: ['/project/src/main.ts'],
        projectReferences: undefined,
        exclude: [],
        configFileParsingDiagnostics: diagnostics.config ?? [],
      })),
    };
    return new NativeCompiler(
      { load: vi.fn() } as any,
      tsConfigProvider as any,
      typescriptLoader as any,
    );
  };

  const run = (compiler: NativeCompiler, onSuccess?: () => void) =>
    compiler.run(
      configuration,
      'tsconfig.json',
      undefined,
      undefined,
      onSuccess,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('creates a program from the tsconfig inputs and emits it', () => {
    const onSuccess = vi.fn();
    const compiler = buildCompiler();

    compiler.run(
      configuration,
      'tsconfig.build.json',
      undefined,
      undefined,
      onSuccess,
    );

    expect(tsConfigProvider.getByConfigFilename).toHaveBeenCalledWith(
      'tsconfig.build.json',
    );
    expect(api.createProgram).toHaveBeenCalledWith(['/project/src/main.ts'], {
      compilerOptions: { outDir: 'dist' },
      projectReferences: undefined,
      configFileParsingDiagnostics: [],
    });
    expect(program.emit).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('hands config parsing diagnostics to createProgram', () => {
    const configError = {
      code: 5025,
      category: ERROR,
      text: "Unknown compiler option 'targt'.",
    };
    run(buildCompiler({ config: [configError] }));

    expect(api.createProgram).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ configFileParsingDiagnostics: [configError] }),
    );
  });

  it('always disposes the program and closes the API session', () => {
    run(buildCompiler());

    expect(program.dispose).toHaveBeenCalledTimes(1);
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });

  it('reports diagnostics from every phase plus emit and exits with 1', () => {
    const onSuccess = vi.fn();
    const compiler = buildCompiler({
      global: [{ code: 5025, category: ERROR, text: 'config' }],
      syntactic: [{ code: 1005, category: ERROR, text: 'syntax' }],
      bind: [{ code: 2300, category: ERROR, text: 'bind' }],
      semantic: [{ code: 2322, category: ERROR, text: 'type' }],
      emit: [{ code: 5055, category: ERROR, text: 'emit' }],
    });

    run(compiler, onSuccess);

    expect(
      nativeModule.formatDiagnosticsWithColorAndContext,
    ).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ code: 5025 }),
        expect.objectContaining({ code: 1005 }),
        expect.objectContaining({ code: 2300 }),
        expect.objectContaining({ code: 2322 }),
        expect.objectContaining({ code: 5055 }),
      ]),
      program,
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Found 5 error(s).'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('prints warnings but does not count them as errors', () => {
    const onSuccess = vi.fn();
    run(
      buildCompiler({
        semantic: [{ code: 6133, category: WARNING, text: 'unused' }],
      }),
      onSuccess,
    );

    expect(console.error).toHaveBeenCalledWith('formatted');
    expect(console.info).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('collects declaration diagnostics only when declarations are emitted', () => {
    run(buildCompiler({}, { declaration: true }));
    expect(program.getDeclarationDiagnostics).toHaveBeenCalledTimes(1);

    const plain = buildCompiler({}, {});
    const plainProgram = program;
    run(plain);
    expect(plainProgram.getSemanticDiagnostics).toHaveBeenCalledTimes(1);
    expect(plainProgram.getDeclarationDiagnostics).not.toHaveBeenCalled();
  });

  it('rejects compiler plugins with an actionable error before compiling', () => {
    const compiler = buildCompiler();
    const withPlugins = {
      sourceRoot: 'src',
      compilerOptions: {
        plugins: ['@nestjs/swagger', { name: '@nestjs/graphql', options: {} }],
      },
    } as unknown as Required<Configuration>;

    expect(() =>
      compiler.run(withPlugins, 'tsconfig.json', undefined, undefined),
    ).toThrow(
      CLI_ERRORS.PLUGINS_UNSUPPORTED_ON_NATIVE_TYPESCRIPT([
        '@nestjs/swagger',
        '@nestjs/graphql',
      ]),
    );
    expect(api.createProgram).not.toHaveBeenCalled();
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });

  it('rejects "paths" aliases with an actionable error before compiling', () => {
    const compiler = buildCompiler(
      {},
      { paths: { '@app/*': ['src/*'], '@lib': ['lib'] } },
    );

    expect(() => run(compiler)).toThrow(
      CLI_ERRORS.PATHS_UNSUPPORTED_ON_NATIVE_TYPESCRIPT(['@app/*', '@lib']),
    );
    expect(api.createProgram).not.toHaveBeenCalled();
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });

  it('accepts an empty or absent "paths"', () => {
    run(buildCompiler({}, { paths: {} }));
    run(buildCompiler({}, {}));
    expect(api.createProgram).toHaveBeenCalledTimes(1);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('closes the session when reading the tsconfig fails', () => {
    const compiler = buildCompiler();
    tsConfigProvider.getByConfigFilename.mockImplementation(() => {
      throw new Error('missing tsconfig');
    });

    expect(() => run(compiler)).toThrow('missing tsconfig');
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });

  it('disposes the program and closes the session when emit throws', () => {
    const compiler = buildCompiler();
    program.emit.mockImplementation(() => {
      throw new Error('emit failed');
    });

    expect(() => run(compiler)).toThrow('emit failed');
    expect(program.dispose).toHaveBeenCalledTimes(1);
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });

  it('closes the session when createProgram throws', () => {
    const compiler = buildCompiler();
    api.createProgram.mockImplementation(() => {
      throw new Error('server crashed');
    });

    expect(() => run(compiler)).toThrow('server crashed');
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });
});
