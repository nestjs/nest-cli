import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativeWatchCompiler } from '../../../../lib/compiler/native/native-watch-compiler.js';
import { Configuration } from '../../../../lib/configuration/index.js';

const watcherHandlers: {
  onAdd?: (file: string) => unknown;
  onChange?: (file: string) => unknown;
  onUnlink?: (file: string) => unknown;
} = {};
const closeWatcher = vi.fn(async () => undefined);
const fsWatchListeners: Array<(...args: any[]) => void> = [];
const watchDirectoryRecursively = vi.fn(async (_dir: string, options: any) => {
  Object.assign(watcherHandlers, options);
  return { close: closeWatcher };
});

vi.mock(
  '../../../../lib/compiler/watchers/recursive-directory-watcher.js',
  () => ({
    watchDirectoryRecursively: (...args: any[]) =>
      watchDirectoryRecursively(...(args as [string, any])),
  }),
);
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    watch: vi.fn((_dir: string, listener: (...args: any[]) => void) => {
      fsWatchListeners.push(listener);
      return { on: vi.fn(), close: vi.fn() };
    }),
  };
});

describe('NativeWatchCompiler (tsc builder on TypeScript 7.1+, watch mode)', () => {
  const cwd = process.cwd();
  const srcDir = join(cwd, 'src');
  const outDir = join(cwd, 'dist');
  const configuration = {
    sourceRoot: 'src',
    compilerOptions: { plugins: [] },
  } as unknown as Required<Configuration>;

  let programs: Record<string, any>[];
  let api: Record<string, any>;
  let typescriptLoader: Record<string, any>;
  let tsConfigProvider: Record<string, any>;
  let compiler: NativeWatchCompiler;

  const makeProgram = (diagnostics: unknown[] = []) => {
    const program = {
      emit: vi.fn(() => ({
        emitSkipped: false,
        diagnostics: [],
        emittedFiles: [],
      })),
      getConfigFileParsingDiagnostics: vi.fn(() => []),
      getProgramDiagnostics: vi.fn(() => []),
      getSyntacticDiagnostics: vi.fn(() => []),
      getBindDiagnostics: vi.fn(() => []),
      getGlobalDiagnostics: vi.fn(() => []),
      getSemanticDiagnostics: vi.fn(() => diagnostics),
      getDeclarationDiagnostics: vi.fn(() => []),
      getConfigFileNames: vi.fn(() => [join(cwd, 'tsconfig.json')]),
      dispose: vi.fn(),
      getCurrentDirectory: () => cwd,
      getCanonicalFileName: (f: string) => f,
      getNewLine: () => '\n',
    };
    programs.push(program);
    return program;
  };

  const flushTimers = async () => {
    await vi.advanceTimersByTimeAsync(150);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    fsWatchListeners.length = 0;
    programs = [];
    api = { createProgram: vi.fn(() => makeProgram()), getNewLine: () => '\n' };
    typescriptLoader = {
      loadNativeModule: vi.fn(() => ({
        API: vi.fn(),
        formatDiagnosticsWithColorAndContext: vi.fn(() => 'formatted'),
      })),
      loadNativeApi: vi.fn(() => api),
      closeNativeApi: vi.fn(),
    };
    tsConfigProvider = {
      getByConfigFilename: vi.fn(() => ({
        options: { outDir, rootDir: srcDir },
        fileNames: [join(srcDir, 'main.ts')],
        projectReferences: undefined,
        exclude: [],
        configFileParsingDiagnostics: [],
      })),
    };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    compiler = new NativeWatchCompiler(
      { load: vi.fn() } as any,
      tsConfigProvider as any,
      typescriptLoader as any,
    );
  });

  afterEach(async () => {
    await compiler.close();
    vi.useRealTimers();
  });

  it('compiles once on start, watches the source root and reports success', async () => {
    const onSuccess = vi.fn();
    await compiler.run(
      configuration,
      'tsconfig.json',
      undefined,
      { preserveWatchOutput: true },
      onSuccess,
    );

    expect(api.createProgram).toHaveBeenCalledTimes(1);
    expect(api.createProgram).toHaveBeenCalledWith(
      [join(srcDir, 'main.ts')],
      expect.objectContaining({ compilerOptions: { outDir, rootDir: srcDir } }),
      undefined,
      undefined,
    );
    expect(programs[0].emit).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(watchDirectoryRecursively).toHaveBeenCalledWith(
      srcDir,
      expect.objectContaining({ extensions: ['.ts', '.tsx', '.mts', '.cts'] }),
    );
  });

  it('batches file events into one incremental program derived from the previous one', async () => {
    await compiler.run(configuration, 'tsconfig.json', undefined, {
      preserveWatchOutput: true,
    });

    watcherHandlers.onAdd!(join(srcDir, 'a.ts'));
    watcherHandlers.onChange!(join(srcDir, 'main.ts'));
    watcherHandlers.onUnlink!(join(srcDir, 'b.ts'));
    await flushTimers();

    expect(api.createProgram).toHaveBeenCalledTimes(2);
    expect(api.createProgram).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      programs[0],
      {
        created: [join(srcDir, 'a.ts')],
        changed: [join(srcDir, 'main.ts')],
        deleted: [join(srcDir, 'b.ts')],
      },
    );
    expect(programs[0].dispose).toHaveBeenCalledTimes(1);
  });

  it('ignores events under outDir and node_modules', async () => {
    await compiler.run(configuration, 'tsconfig.json', undefined, {
      preserveWatchOutput: true,
    });

    watcherHandlers.onChange!(join(outDir, 'main.js'));
    watcherHandlers.onChange!(join(cwd, 'node_modules', 'x', 'index.d.ts'));
    await flushTimers();

    expect(api.createProgram).toHaveBeenCalledTimes(1);
  });

  it('keeps the pending changes when a rebuild fails so the next one still sees them', async () => {
    await compiler.run(configuration, 'tsconfig.json', undefined, {
      preserveWatchOutput: true,
    });

    tsConfigProvider.getByConfigFilename.mockImplementationOnce(() => {
      throw new Error('broken tsconfig');
    });
    watcherHandlers.onChange!(join(srcDir, 'a.ts'));
    await flushTimers();
    expect(api.createProgram).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('broken tsconfig');

    watcherHandlers.onChange!(join(srcDir, 'b.ts'));
    await flushTimers();
    expect(api.createProgram).toHaveBeenCalledTimes(2);
    expect(api.createProgram).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      programs[0],
      { changed: [join(srcDir, 'a.ts'), join(srcDir, 'b.ts')] },
    );
  });

  it('does not call onSuccess when the rebuild has errors', async () => {
    const onSuccess = vi.fn();
    await compiler.run(
      configuration,
      'tsconfig.json',
      undefined,
      { preserveWatchOutput: true },
      onSuccess,
    );
    api.createProgram.mockImplementationOnce(() =>
      makeProgram([{ code: 2322, text: 'boom' }]),
    );

    watcherHandlers.onChange!(join(srcDir, 'main.ts'));
    await flushTimers();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('formatted');
  });

  it('rebuilds from scratch when a config file changes', async () => {
    await compiler.run(configuration, 'tsconfig.json', undefined, {
      preserveWatchOutput: true,
    });

    watcherHandlers.onChange!(join(srcDir, 'main.ts'));
    // Emitted by the directory watcher that guards the config files.
    fsWatchListeners.at(-1)!('rename', 'tsconfig.json');
    fsWatchListeners.at(-1)!('change', 'unrelated.json');
    await flushTimers();

    expect(api.createProgram).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      programs[0],
      {
        changed: [join(srcDir, 'main.ts'), join(cwd, 'tsconfig.json')],
        invalidateAll: true,
      },
    );
  });

  it('close() stops the watchers and disposes the current program', async () => {
    await compiler.run(configuration, 'tsconfig.json', undefined, {
      preserveWatchOutput: true,
    });

    await compiler.close();

    expect(closeWatcher).toHaveBeenCalledTimes(1);
    expect(programs[0].dispose).toHaveBeenCalledTimes(1);
    watcherHandlers.onChange!(join(srcDir, 'main.ts'));
    await flushTimers();
    expect(api.createProgram).toHaveBeenCalledTimes(1);
  });
});
