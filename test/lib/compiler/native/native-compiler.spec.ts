import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeCompiler } from '../../../../lib/compiler/native/native-compiler.js';
import { Configuration } from '../../../../lib/configuration/index.js';
import { CLI_ERRORS } from '../../../../lib/ui/index.js';

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
      getConfigFileParsingDiagnostics: vi.fn(() => diagnostics.config ?? []),
      getProgramDiagnostics: vi.fn(() => diagnostics.program ?? []),
      getSyntacticDiagnostics: vi.fn(() => diagnostics.syntactic ?? []),
      getBindDiagnostics: vi.fn(() => diagnostics.bind ?? []),
      getGlobalDiagnostics: vi.fn(() => diagnostics.global ?? []),
      getSemanticDiagnostics: vi.fn(() => diagnostics.semantic ?? []),
      getDeclarationDiagnostics: vi.fn(() => diagnostics.declaration ?? []),
      dispose: vi.fn(),
      getCurrentDirectory: () => '/project',
      getCanonicalFileName: (f: string) => f,
      getNewLine: () => '\n',
    };
    api = {
      createProgram: vi.fn(() => program),
      getNewLine: () => '\n',
    };
    nativeModule = {
      API: vi.fn(),
      formatDiagnosticsWithColorAndContext: vi.fn(() => 'formatted'),
    };
    typescriptLoader = {
      loadNativeModule: vi.fn(() => nativeModule),
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

  it('always disposes the program and closes the API session', () => {
    const compiler = buildCompiler();
    compiler.run(configuration, 'tsconfig.json', undefined, undefined);

    expect(program.dispose).toHaveBeenCalledTimes(1);
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });

  it('hands config parsing diagnostics to createProgram so the native program reports them', () => {
    const configError = {
      code: 5025,
      text: "Unknown compiler option 'targt'.",
    };
    const compiler = buildCompiler({ config: [configError] });

    compiler.run(configuration, 'tsconfig.json', undefined, undefined);

    expect(api.createProgram).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ configFileParsingDiagnostics: [configError] }),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('reports diagnostics from every phase plus emit and exits with 1', () => {
    const onSuccess = vi.fn();
    const compiler = buildCompiler({
      semantic: [{ code: 2322, text: 'a' }],
      syntactic: [{ code: 1005, text: 'b' }],
      bind: [{ code: 2300, text: 'd' }],
      emit: [{ code: 5055, text: 'c' }],
    });

    compiler.run(
      configuration,
      'tsconfig.json',
      undefined,
      undefined,
      onSuccess,
    );

    expect(
      nativeModule.formatDiagnosticsWithColorAndContext,
    ).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ code: 2322 }),
        expect.objectContaining({ code: 1005 }),
        expect.objectContaining({ code: 2300 }),
        expect.objectContaining({ code: 5055 }),
      ]),
      program,
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Found 4 error(s).'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('does not report the same diagnostic twice when phases overlap', () => {
    const duplicate = {
      code: 5011,
      text: 'rootDir',
      pos: 0,
      fileName: '/project/tsconfig.json',
    };
    const compiler = buildCompiler({
      config: [duplicate],
      program: [duplicate],
    });

    compiler.run(configuration, 'tsconfig.json', undefined, undefined);

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Found 1 error(s).'),
    );
  });

  it('collects declaration diagnostics only when declarations are emitted', () => {
    const compiler = buildCompiler({}, { declaration: true });
    compiler.run(configuration, 'tsconfig.json', undefined, undefined);
    expect(program.getDeclarationDiagnostics).toHaveBeenCalledTimes(1);

    const withoutDeclarations = buildCompiler({}, {});
    withoutDeclarations.run(
      configuration,
      'tsconfig.json',
      undefined,
      undefined,
    );
    expect(program.getDeclarationDiagnostics).not.toHaveBeenCalled();
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

  it('closes the API session when reading the tsconfig fails', () => {
    const compiler = buildCompiler();
    tsConfigProvider.getByConfigFilename.mockImplementation(() => {
      throw new Error('missing tsconfig');
    });

    expect(() =>
      compiler.run(configuration, 'tsconfig.json', undefined, undefined),
    ).toThrow('missing tsconfig');
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });

  it('disposes the program and closes the session when emit throws', () => {
    const compiler = buildCompiler();
    program.emit.mockImplementation(() => {
      throw new Error('emit failed');
    });

    expect(() =>
      compiler.run(configuration, 'tsconfig.json', undefined, undefined),
    ).toThrow('emit failed');
    expect(program.dispose).toHaveBeenCalledTimes(1);
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });

  it('closes the session when createProgram throws', () => {
    const compiler = buildCompiler();
    api.createProgram.mockImplementation(() => {
      throw new Error('server crashed');
    });

    expect(() =>
      compiler.run(configuration, 'tsconfig.json', undefined, undefined),
    ).toThrow('server crashed');
    expect(typescriptLoader.closeNativeApi).toHaveBeenCalledTimes(1);
  });

  it('does not warn when "paths" is empty or absent', () => {
    buildCompiler({}, { paths: {} }).run(
      configuration,
      'tsconfig.json',
      undefined,
      undefined,
    );
    buildCompiler({}, {}).run(
      configuration,
      'tsconfig.json',
      undefined,
      undefined,
    );
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('warns when "paths" aliases are configured', () => {
    const compiler = buildCompiler({}, { paths: { '@app/*': ['src/*'] } });
    compiler.run(configuration, 'tsconfig.json', undefined, undefined);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('compilerOptions.paths'),
    );
  });
});
