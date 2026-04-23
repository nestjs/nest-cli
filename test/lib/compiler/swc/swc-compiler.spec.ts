import * as childProcess from 'child_process';
import * as chokidar from 'chokidar';
import { stat } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { swcDefaultsFactory } from '../../../../lib/compiler/defaults/swc-defaults.js';
import { getValueOrDefault } from '../../../../lib/compiler/helpers/get-value-or-default.js';
import { PluginsLoader } from '../../../../lib/compiler/plugins/plugins-loader.js';
import { SwcCompiler } from '../../../../lib/compiler/swc/swc-compiler.js';

vi.mock('../../../../lib/compiler/defaults/swc-defaults.js', () => ({
  swcDefaultsFactory: vi.fn(),
}));

vi.mock('../../../../lib/compiler/helpers/get-value-or-default.js', () => ({
  getValueOrDefault: vi.fn(),
}));

vi.mock('chokidar');
vi.mock('child_process', async () => ({
  ...(await vi.importActual('child_process')),
  spawnSync: vi.fn(),
}));
vi.mock('fs/promises', () => ({
  stat: vi.fn(),
}));

describe('SWC Compiler', () => {
  let compiler: SwcCompiler;
  let debounceMock = vi.fn();
  const swcOptionsFixture = {
    swcOptions: {},
    cliOptions: {},
  } as ReturnType<typeof swcDefaultsFactory>;

  const callRunCompiler = async ({
    configuration,
    tsconfig,
    appName,
    extras,
    onSuccess,
  }: any) => {
    return await compiler.run(
      configuration || {},
      tsconfig || '',
      appName || '',
      extras || {},
      onSuccess ?? vi.fn(),
    );
  };

  beforeEach(() => {
    const PluginsLoaderStub = {
      load: () => vi.fn(),
      resolvePluginReferences: () => vi.fn(),
    } as unknown as PluginsLoader;

    compiler = new SwcCompiler(PluginsLoaderStub);

    compiler['runSwc'] = vi.fn();
    compiler['runTypeChecker'] = vi.fn();
    compiler['debounce'] = debounceMock;
    compiler['watchFilesInOutDir'] = vi.fn();

    vi.clearAllMocks();
  });

  describe('run', () => {
    it('should call swcDefaultsFactory with tsOptions and configuration', async () => {
      const fixture = {
        extras: {
          tsOptions: {
            _tsOptionsTest: {},
          },
        },
        configuration: {
          _configurationTest: {},
        },
      };

      await callRunCompiler({
        configuration: fixture.configuration,
        extras: fixture.extras,
      });
      expect(vi.mocked(swcDefaultsFactory)).toHaveBeenCalledWith(
        fixture.extras.tsOptions,
        fixture.configuration,
      );
    });

    it('should call getValueOrDefault with configuration, swcrcPath and appName', async () => {
      const fixture = {
        configuration: '_configurationTest',
        appName: 'appNameTest',
      };

      await callRunCompiler({
        configuration: fixture.configuration,
        appName: fixture.appName,
      });

      expect(vi.mocked(getValueOrDefault)).toHaveBeenCalledWith(
        fixture.configuration,
        'compilerOptions.builder.options.swcrcPath',
        fixture.appName,
      );
    });

    it('should not call runTypeChecker when extras.typeCheck is false', async () => {
      const fixture = {
        extras: {
          watch: false,
          typeCheck: false,
          tsOptions: null,
        },
      };

      fixture.extras.watch = true;
      await callRunCompiler({
        extras: fixture.extras,
      });

      fixture.extras.watch = false;
      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(compiler['runTypeChecker']).not.toHaveBeenCalled();
    });

    it('should call runTypeChecker when extras.typeCheck is true', async () => {
      const fixture = {
        configuration: '_configurationTest',
        tsConfigPath: 'tsConfigPathTest',
        appName: 'appNameTest',
        extras: {
          watch: false,
          typeCheck: true,
          tsOptions: null,
        },
      };

      fixture.extras.watch = true;
      await callRunCompiler({
        configuration: fixture.configuration,
        extras: fixture.extras,
        appName: fixture.appName,
        tsconfig: fixture.tsConfigPath,
      });

      fixture.extras.watch = false;
      await callRunCompiler({
        configuration: fixture.configuration,
        extras: fixture.extras,
        appName: fixture.appName,
        tsconfig: fixture.tsConfigPath,
      });

      expect(compiler['runTypeChecker']).toHaveBeenCalledTimes(2);
      expect(compiler['runTypeChecker']).toHaveBeenCalledWith(
        fixture.configuration,
        fixture.tsConfigPath,
        fixture.appName,
        fixture.extras,
      );
    });

    it('should call runSwc', async () => {
      vi.mocked(swcDefaultsFactory).mockReturnValueOnce(swcOptionsFixture);
      vi.mocked(getValueOrDefault).mockReturnValueOnce('swcrcPathTest');

      const fixture = {
        extras: {
          watch: false,
        },
      };

      fixture.extras.watch = true;
      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(compiler['runSwc']).toHaveBeenCalledWith(
        swcOptionsFixture,
        fixture.extras,
        'swcrcPathTest',
      );

      fixture.extras.watch = false;
      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(compiler['runSwc']).toHaveBeenCalledWith(
        swcOptionsFixture,
        fixture.extras,
        'swcrcPathTest',
      );
    });

    it('should not call onSuccess method when is not defined', async () => {
      expect(async () => {
        await callRunCompiler({});
      }).not.toThrow();
    });

    it('should call onSuccess method when is defined', async () => {
      const onSuccessMock = vi.fn();
      await callRunCompiler({
        onSuccess: onSuccessMock,
        extras: {
          watch: false,
        },
      });

      await callRunCompiler({
        onSuccess: onSuccessMock,
        extras: {
          watch: true,
        },
      });

      expect(onSuccessMock).toHaveBeenCalledTimes(2);
    });

    it('should not call watchFilesInOutDir or debounce method when extras.watch is false', async () => {
      await callRunCompiler({
        extras: {
          watch: false,
        },
      });

      expect(compiler['watchFilesInOutDir']).not.toHaveBeenCalled();
      expect(compiler['debounce']).not.toHaveBeenCalled();
    });

    it('should not call watchFilesInOutDir or debounce method when extras.watch is true but onSuccess is not defined', async () => {
      await callRunCompiler({
        extras: {
          watch: true,
        },
        onSuccess: false,
      });

      expect(compiler['watchFilesInOutDir']).not.toHaveBeenCalled();
      expect(compiler['debounce']).not.toHaveBeenCalled();
    });

    it('should call debounce method with debounceTime and onSuccess method and when extras.watch is true', async () => {
      const fixture = {
        onSuccess: vi.fn(),
      };

      await callRunCompiler({
        onSuccess: fixture.onSuccess,
        extras: {
          watch: true,
        },
      });

      expect(compiler['debounce']).toHaveBeenCalledWith(fixture.onSuccess, 150);
    });

    it('should call watchFilesInOutDir method with swcOptions and callback when extras.watch is true', async () => {
      vi.mocked(swcDefaultsFactory).mockReturnValueOnce(swcOptionsFixture);
      debounceMock.mockReturnValueOnce('debounceTest');

      await callRunCompiler({
        extras: {
          watch: true,
        },
      });

      expect(compiler['watchFilesInOutDir']).toHaveBeenCalledWith(
        swcOptionsFixture,
        'debounceTest',
      );
    });

    it('should not call closeWatchers method when extras.watch is true', async () => {
      const closeWatchersMock = vi.fn();
      const fixture = {
        extras: {
          watch: true,
          assetsManager: {
            closeWatchers: closeWatchersMock,
          },
        },
      };

      await callRunCompiler({
        extras: fixture.extras,
      });

      await callRunCompiler({
        extras: fixture.extras,
        onSuccess: false,
      });

      expect(closeWatchersMock).not.toHaveBeenCalled();
    });

    it('should call closeWatchers method when extras.watch is false', async () => {
      const closeWatchersMock = vi.fn();
      const fixture = {
        extras: {
          watch: false,
          assetsManager: {
            closeWatchers: closeWatchersMock,
          },
        },
      };

      await callRunCompiler({
        extras: fixture.extras,
        onSuccess: false,
      });

      await callRunCompiler({
        extras: fixture.extras,
      });

      expect(closeWatchersMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitDeclarations', () => {
      it('should call emitDeclarations when extras.emitDeclarations is true and watch is false', async () => {
        compiler['emitDeclarations'] = vi.fn();

        await callRunCompiler({
          configuration: '_configurationTest',
          tsconfig: 'tsconfig.json',
          appName: 'appNameTest',
          extras: {
            watch: false,
            typeCheck: false,
            emitDeclarations: true,
            tsOptions: null,
          },
        });

        expect(compiler['emitDeclarations']).toHaveBeenCalledWith(
          'tsconfig.json',
        );
      });

      it('should call emitDeclarations when extras.emitDeclarations is true and watch is true', async () => {
        compiler['emitDeclarations'] = vi.fn();

        await callRunCompiler({
          configuration: '_configurationTest',
          tsconfig: 'tsconfig.json',
          appName: 'appNameTest',
          extras: {
            watch: true,
            typeCheck: false,
            emitDeclarations: true,
            tsOptions: null,
          },
        });

        expect(compiler['emitDeclarations']).toHaveBeenCalledWith(
          'tsconfig.json',
        );
      });

      it('should not call emitDeclarations when extras.emitDeclarations is false', async () => {
        compiler['emitDeclarations'] = vi.fn();

        await callRunCompiler({
          configuration: '_configurationTest',
          tsconfig: 'tsconfig.json',
          appName: 'appNameTest',
          extras: {
            watch: false,
            typeCheck: false,
            emitDeclarations: false,
            tsOptions: null,
          },
        });

        expect(compiler['emitDeclarations']).not.toHaveBeenCalled();
      });

      it('should spawn tsc with --emitDeclarationOnly flag', async () => {
        const originalEmitDeclarations =
          SwcCompiler.prototype['emitDeclarations'];
        compiler['emitDeclarations'] =
          originalEmitDeclarations.bind(compiler);

        (childProcess.spawnSync as ReturnType<typeof vi.fn>).mockReturnValue({ status: 0 });

        compiler['emitDeclarations']('tsconfig.json');

        // Flush process.nextTick to avoid "Cannot log after tests are done" warning
        await new Promise((resolve) => process.nextTick(resolve));

        expect(childProcess.spawnSync).toHaveBeenCalledWith(
          expect.stringContaining('tsc'),
          ['--emitDeclarationOnly', '-p', 'tsconfig.json'],
          expect.objectContaining({
            cwd: process.cwd(),
            stdio: 'inherit',
            shell: true,
          }),
        );
      });

      it('should log error when tsc exits with non-zero status', async () => {
        const originalEmitDeclarations =
          SwcCompiler.prototype['emitDeclarations'];
        compiler['emitDeclarations'] =
          originalEmitDeclarations.bind(compiler);

        (childProcess.spawnSync as ReturnType<typeof vi.fn>).mockReturnValue({ status: 1 });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        compiler['emitDeclarations']('tsconfig.json');

        // Flush process.nextTick to avoid "Cannot log after tests are done" warning
        await new Promise((resolve) => process.nextTick(resolve));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to emit declaration files'),
        );

        consoleErrorSpy.mockRestore();
      });
    });

  describe('watchFilesInOutDir', () => {
    let originalWatchFilesInOutDir: Function;

    beforeEach(() => {
      // Restore the real implementation that was mocked in the outer beforeEach
      originalWatchFilesInOutDir = SwcCompiler.prototype['watchFilesInOutDir'];
      compiler['watchFilesInOutDir'] =
        originalWatchFilesInOutDir.bind(compiler);
    });

    it('should only register add/change listeners after the watcher is ready', () => {
      const listeners: Record<string, Function[]> = {};
      const mockWatcher = {
        on: vi.fn((event: string, handler: Function) => {
          if (!listeners[event]) {
            listeners[event] = [];
          }
          listeners[event].push(handler);
          return mockWatcher;
        }),
      };
      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher as any);

      const onChange = vi.fn();
      const options = {
        cliOptions: {
          outDir: '/tmp/test-out',
        },
      };

      // Call the private method directly
      compiler['watchFilesInOutDir'](options as any, onChange);

      // Before 'ready' fires, there should be no 'add' or 'change' listeners
      expect(listeners['ready']).toBeDefined();
      expect(listeners['ready']).toHaveLength(1);
      expect(listeners['add']).toBeUndefined();
      expect(listeners['change']).toBeUndefined();

      // Simulate the 'ready' event
      listeners['ready'][0]();

      // After 'ready', add and change listeners should be registered
      expect(listeners['add']).toBeDefined();
      expect(listeners['add']).toHaveLength(1);
      expect(listeners['change']).toBeDefined();
      expect(listeners['change']).toHaveLength(1);
    });

    it('should not trigger onChange for file events that occur before watcher is ready', () => {
      const listeners: Record<string, Function[]> = {};
      const mockWatcher = {
        on: vi.fn((event: string, handler: Function) => {
          if (!listeners[event]) {
            listeners[event] = [];
          }
          listeners[event].push(handler);
          return mockWatcher;
        }),
      };
      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher as any);

      const onChange = vi.fn();
      const options = {
        cliOptions: {
          outDir: '/tmp/test-out',
        },
      };

      compiler['watchFilesInOutDir'](options as any, onChange);

      // Before 'ready', no add/change listeners exist, so no way to trigger onChange
      // This verifies that even if files are written during initial scan,
      // onChange won't be called
      expect(onChange).not.toHaveBeenCalled();

      // Now emit ready, then simulate a file change
      listeners['ready'][0]();
      listeners['add'][0]();

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('watchFilesInSrcDir', () => {
    let originalWatchFilesInSrcDir: Function;

    beforeEach(() => {
      originalWatchFilesInSrcDir =
        SwcCompiler.prototype['watchFilesInSrcDir'];
      compiler['watchFilesInSrcDir'] =
        originalWatchFilesInSrcDir.bind(compiler);

      vi.mocked(stat).mockResolvedValue({ isDirectory: () => true } as any);
    });

    it('should not ignore .ts files when extensions include ts', async () => {
      const mockWatcher = {
        on: vi.fn().mockReturnThis(),
      };
      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher as any);

      const onFileAdded = vi.fn();
      const options = {
        cliOptions: {
          filenames: ['src'],
          extensions: ['js', 'ts'],
        },
      };

      await compiler['watchFilesInSrcDir'](options as any, onFileAdded);

      const watchOptions = vi.mocked(chokidar.watch).mock.calls[0][1] as any;
      const ignoredFn = watchOptions.ignored;

      const fileStats = { isFile: () => true };

      // .ts files should NOT be ignored
      expect(ignoredFn('src/app.service.ts', fileStats)).toBe(false);
      // .js files should NOT be ignored
      expect(ignoredFn('src/app.service.js', fileStats)).toBe(false);
      // Non-matching files should be ignored
      expect(ignoredFn('src/data.json', fileStats)).toBe(true);
      // Directories should not be ignored
      const dirStats = { isFile: () => false };
      expect(ignoredFn('src/subdir', dirStats)).toBe(false);
    });

    it('should skip watching if source directory does not exist', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      const onFileAdded = vi.fn();
      const options = {
        cliOptions: {
          filenames: ['src'],
          extensions: ['ts'],
        },
      };

      await compiler['watchFilesInSrcDir'](options as any, onFileAdded);

      expect(chokidar.watch).not.toHaveBeenCalled();
    });

    it('should skip watching if filenames is empty', async () => {
      const onFileAdded = vi.fn();
      const options = {
        cliOptions: {
          filenames: [],
          extensions: ['ts'],
        },
      };

      await compiler['watchFilesInSrcDir'](options as any, onFileAdded);

      expect(chokidar.watch).not.toHaveBeenCalled();
    });
  });

  describe('shouldLogSwcStatus', () => {
    const originalLogLevel = process.env.npm_config_loglevel;

    afterEach(() => {
      process.env.npm_config_loglevel = originalLogLevel;
    });

    it('should return false when extras.silent is true', () => {
      const result = compiler['shouldLogSwcStatus']({
        silent: true,
      } as any);
      expect(result).toBe(false);
    });

    it('should return false when npm log level is silent', () => {
      process.env.npm_config_loglevel = 'silent';

      const result = compiler['shouldLogSwcStatus']({
        silent: false,
      } as any);
      expect(result).toBe(false);
    });

    it('should return true when silent mode is not enabled', () => {
      process.env.npm_config_loglevel = 'warn';

      const result = compiler['shouldLogSwcStatus']({
        silent: false,
      } as any);
      expect(result).toBe(true);
    });
  });
});
