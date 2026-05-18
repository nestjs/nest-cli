import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { PluginsLoader } from '../../../../lib/compiler/plugins/plugins-loader.js';
import { RspackCompiler } from '../../../../lib/compiler/rspack-compiler.js';

import { existsSync } from 'fs';
import { rspackDefaultsFactory } from '../../../../lib/compiler/defaults/rspack-defaults.js';
import { getValueOrDefault } from '../../../../lib/compiler/helpers/get-value-or-default.js';
import * as esmProjectUtil from '../../../../lib/utils/is-esm-project.js';

// Hoist rspack mock so it can be used in createRequire mock
const { mockRspackModule, mockCompiler } = vi.hoisted(() => {
  const mockWatchRunTapAsync = vi.fn();
  const mockWatch = vi.fn();
  const mockRun = vi.fn();
  const mockCompiler = {
    hooks: { watchRun: { tapAsync: mockWatchRunTapAsync } },
    watch: mockWatch,
    run: mockRun,
  };
  return {
    mockRspackModule: {
      rspack: vi.fn().mockReturnValue(mockCompiler),
      IgnorePlugin: vi.fn(),
    },
    mockCompiler,
  };
});

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return { ...actual, existsSync: vi.fn().mockReturnValue(true) };
});

// Mock createRequire to intercept require('@rspack/core')
vi.mock('module', async (importOriginal) => {
  const actual = await importOriginal<typeof import('module')>();
  return {
    ...actual,
    createRequire: (url: string | URL) => {
      const realReq = actual.createRequire(url);
      const mockedReq: any = (id: string) => {
        if (id === '@rspack/core') return mockRspackModule;
        return realReq(id);
      };
      mockedReq.resolve = realReq.resolve.bind(realReq);
      mockedReq.resolve.paths = realReq.resolve.paths?.bind(realReq.resolve);
      return mockedReq;
    },
  };
});

vi.mock('../../../../lib/compiler/defaults/rspack-defaults.js', () => ({
  rspackDefaultsFactory: vi.fn().mockReturnValue({
    mode: 'none',
    entry: 'src/main.ts',
  }),
}));

vi.mock('../../../../lib/compiler/helpers/get-value-or-default.js', () => ({
  getValueOrDefault: vi.fn().mockReturnValue(''),
}));

vi.mock('../../../../lib/utils/is-esm-project.js');

describe('Rspack Compiler', () => {
  let compiler: RspackCompiler;

  // Access mock functions from the hoisted rspack mock
  const mockCompilerInstance = mockRspackModule.rspack() as any;
  const mockWatchRunTapAsync = mockCompilerInstance.hooks.watchRun.tapAsync;
  const mockWatch = mockCompilerInstance.watch;
  const mockRun = mockCompilerInstance.run;

  beforeEach(() => {
    vi.clearAllMocks();

    // Re-set mock return values after clearAllMocks
    mockRspackModule.rspack.mockReturnValue(mockCompiler);
    vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(false);

    const PluginsLoaderStub = {
      load: () => ({
        beforeHooks: [],
        afterHooks: [],
        afterDeclarationsHooks: [],
      }),
      resolvePluginReferences: () => vi.fn(),
    } as unknown as PluginsLoader;

    compiler = new RspackCompiler(PluginsLoaderStub);

    vi.mocked(rspackDefaultsFactory).mockReturnValue({
      mode: 'none',
      entry: 'src/main.ts',
    } as any);
    vi.mocked(getValueOrDefault).mockReturnValue('');

    vi.mocked(existsSync).mockReturnValue(true);
    vi.spyOn(compiler as any, 'loadPlugins').mockReturnValue({
      beforeHooks: [],
      afterHooks: [],
      afterDeclarationsHooks: [],
    });
    vi.spyOn(compiler as any, 'getPathToSource').mockReturnValue('src');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeExtras = (overrides: Record<string, any> = {}) => ({
    options: {},
    assetsManager: { closeWatchers: vi.fn() } as any,
    rspackConfigFactoryOrConfig: {},
    debug: false,
    watchMode: false,
    ...overrides,
  });

  const makeConfiguration = () =>
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
    }) as any;

  describe('run', () => {
    it('should throw if tsconfig file does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() =>
        compiler.run(
          makeConfiguration(),
          'tsconfig.json',
          undefined,
          makeExtras(),
        ),
      ).toThrow('Could not find TypeScript configuration file');
    });

    it('should call rspackDefaultsFactory with correct arguments', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce('main') // entryFile
        .mockReturnValueOnce(''); // entryFileRoot

      // require('@rspack/core') will be called inside run()
      // We need to mock it at module level

      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras(),
      );

      expect(vi.mocked(rspackDefaultsFactory)).toHaveBeenCalledWith(
        'src',
        '',
        'main',
        false,
        'tsconfig.json',
        expect.objectContaining({
          beforeHooks: [],
          afterHooks: [],
          afterDeclarationsHooks: [],
        }),
        false,
      );
    });

    it('should call rspackDefaultsFactory with isEsm=true for ESM projects', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(true);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('');

      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras(),
      );

      expect(vi.mocked(rspackDefaultsFactory)).toHaveBeenCalledWith(
        'src',
        '',
        'main',
        false,
        'tsconfig.json',
        expect.anything(),
        true,
      );
    });

    it('should call rspackDefaultsFactory with debug=true when debug is enabled', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(getValueOrDefault).mockReturnValueOnce('main').mockReturnValueOnce('');


      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras({ debug: true }),
      );

      expect(vi.mocked(rspackDefaultsFactory)).toHaveBeenCalledWith(
        'src',
        '',
        'main',
        true,
        'tsconfig.json',
        expect.anything(),
        false,
      );
    });

    it('should use config factory function when provided', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(getValueOrDefault).mockReturnValueOnce('main').mockReturnValueOnce('');

      const configFactory = vi.fn().mockReturnValue({ entry: 'custom.ts' });


      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras({ rspackConfigFactoryOrConfig: configFactory }),
      );

      expect(configFactory).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'none', entry: 'src/main.ts' }),
        mockRspackModule,
      );
    });

    it('should merge plain config object when provided', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(getValueOrDefault).mockReturnValueOnce('main').mockReturnValueOnce('');

      const plainConfig = { entry: 'custom.ts' };


      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras({ rspackConfigFactoryOrConfig: plainConfig }),
      );

      // rspack.rspack should be called with merged config
      expect(mockRspackModule.rspack).toHaveBeenCalledWith(
        expect.objectContaining({ entry: 'custom.ts' }),
      );
    });

    it('should handle array of configurations (multi-compiler)', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(getValueOrDefault).mockReturnValueOnce('main').mockReturnValueOnce('');

      const configs = [{ entry: 'first.ts' }, { entry: 'second.ts' }];


      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras({ rspackConfigFactoryOrConfig: configs }),
      );

      expect(mockRspackModule.rspack).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ entry: 'first.ts' }),
          expect.objectContaining({ entry: 'second.ts' }),
        ]),
      );
    });

    it('should set mode to development in watch mode', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(getValueOrDefault).mockReturnValueOnce('main').mockReturnValueOnce('');


      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras({ watchMode: true }),
      );

      expect(mockRspackModule.rspack).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'development' }),
      );
    });

    it('should call compiler.watch when watchMode is true', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(getValueOrDefault).mockReturnValueOnce('main').mockReturnValueOnce('');


      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras({ watchMode: true }),
      );

      expect(mockWatchRunTapAsync).toHaveBeenCalledWith(
        'Rebuild info',
        expect.any(Function),
      );
      expect(mockWatch).toHaveBeenCalled();
      expect(mockRun).not.toHaveBeenCalled();
    });

    it('should call compiler.run when watchMode is false', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(getValueOrDefault).mockReturnValueOnce('main').mockReturnValueOnce('');


      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras({ watchMode: false }),
      );

      expect(mockRun).toHaveBeenCalled();
      expect(mockWatch).not.toHaveBeenCalled();
    });
  });

  describe('createAfterCallback', () => {
    it('should call onSuccess when compilation succeeds', () => {
      const onSuccess = vi.fn();
      const assetsManager = { closeWatchers: vi.fn() };

      const callback = (compiler as any).createAfterCallback(
        onSuccess,
        assetsManager,
        false,
        false,
      );

      const mockStats = {
        hasErrors: () => false,
        toString: () => 'compiled successfully',
      };

      callback(null, mockStats);

      expect(onSuccess).toHaveBeenCalled();
      expect(assetsManager.closeWatchers).not.toHaveBeenCalled();
    });

    it('should close watchers when onSuccess is not defined', () => {
      const assetsManager = { closeWatchers: vi.fn() };

      const callback = (compiler as any).createAfterCallback(
        undefined,
        assetsManager,
        false,
        false,
      );

      const mockStats = {
        hasErrors: () => false,
        toString: () => 'compiled successfully',
      };

      callback(null, mockStats);

      expect(assetsManager.closeWatchers).toHaveBeenCalled();
    });

    it('should exit with code 1 when err is set and stats is undefined', () => {
      const mockExit = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      const callback = (compiler as any).createAfterCallback(
        undefined,
        { closeWatchers: vi.fn() },
        false,
        false,
      );

      callback(new Error('compile error'), undefined);

      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should exit with code 1 on errors in non-watch mode', () => {
      const mockExit = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      const callback = (compiler as any).createAfterCallback(
        undefined,
        { closeWatchers: vi.fn() },
        false,
        false,
      );

      const mockStats = {
        hasErrors: () => true,
        toString: () => 'errors found',
      };

      callback(null, mockStats);

      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should not exit on errors in watch mode', () => {
      const mockExit = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      const callback = (compiler as any).createAfterCallback(
        undefined,
        { closeWatchers: vi.fn() },
        true,
        false,
      );

      const mockStats = {
        hasErrors: () => true,
        toString: () => 'errors found',
      };

      callback(null, mockStats);

      expect(mockExit).not.toHaveBeenCalled();

      mockExit.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});
