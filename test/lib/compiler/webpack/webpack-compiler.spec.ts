import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { PluginsLoader } from '../../../../lib/compiler/plugins/plugins-loader.js';
import { WebpackCompiler } from '../../../../lib/compiler/webpack-compiler.js';

import { existsSync } from 'fs';
import { webpackDefaultsFactory } from '../../../../lib/compiler/defaults/webpack-defaults.js';
import { getValueOrDefault } from '../../../../lib/compiler/helpers/get-value-or-default.js';
import * as esmProjectUtil from '../../../../lib/utils/is-esm-project.js';

// Hoist webpack mock
const { mockWebpackModule, mockCompiler } = vi.hoisted(() => {
  const mockWatchRunTapAsync = vi.fn();
  const mockWatch = vi.fn();
  const mockRun = vi.fn();
  const mockCompiler = {
    hooks: { watchRun: { tapAsync: mockWatchRunTapAsync } },
    watch: mockWatch,
    run: mockRun,
  };
  const mockWebpack = Object.assign(vi.fn().mockReturnValue(mockCompiler), {
    IgnorePlugin: vi.fn(),
  });
  return { mockWebpackModule: mockWebpack, mockCompiler };
});

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return { ...actual, existsSync: vi.fn().mockReturnValue(true) };
});

vi.mock('module', async (importOriginal) => {
  const actual = await importOriginal<typeof import('module')>();
  return {
    ...actual,
    createRequire: (url: string | URL) => {
      const realReq = actual.createRequire(url);
      const mockedReq: any = (id: string) => {
        if (id === 'webpack') return mockWebpackModule;
        return realReq(id);
      };
      mockedReq.resolve = realReq.resolve.bind(realReq);
      mockedReq.resolve.paths = realReq.resolve.paths?.bind(realReq.resolve);
      return mockedReq;
    },
  };
});

vi.mock('../../../../lib/compiler/defaults/webpack-defaults.js', () => ({
  webpackDefaultsFactory: vi.fn().mockReturnValue({
    mode: 'none',
    entry: 'src/main.ts',
  }),
}));

vi.mock('../../../../lib/compiler/helpers/get-value-or-default.js', () => ({
  getValueOrDefault: vi.fn().mockReturnValue(''),
}));

vi.mock('../../../../lib/utils/is-esm-project.js');

describe('Webpack Compiler', () => {
  let compiler: WebpackCompiler;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  const mockCompilerInstance = mockWebpackModule() as any;
  const mockRun = mockCompilerInstance.run;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWebpackModule.mockReturnValue(mockCompiler);
    vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(false);

    const PluginsLoaderStub = {
      load: () => ({
        beforeHooks: [],
        afterHooks: [],
        afterDeclarationsHooks: [],
      }),
      resolvePluginReferences: () => vi.fn(),
    } as unknown as PluginsLoader;

    compiler = new WebpackCompiler(PluginsLoaderStub);

    vi.mocked(webpackDefaultsFactory).mockReturnValue({
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

    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeExtras = (overrides: Record<string, any> = {}) => ({
    options: {},
    assetsManager: { closeWatchers: vi.fn() } as any,
    webpackConfigFactoryOrConfig: {},
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

  describe('ESM project rejection', () => {
    it('should throw an error when the project is ESM', () => {
      vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(true);

      expect(() =>
        compiler.run(
          makeConfiguration(),
          'tsconfig.json',
          undefined,
          makeExtras(),
        ),
      ).toThrow(
        'The webpack compiler does not support ESM projects',
      );
    });

    it('should suggest using rspack in the error message', () => {
      vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(true);

      expect(() =>
        compiler.run(
          makeConfiguration(),
          'tsconfig.json',
          undefined,
          makeExtras(),
        ),
      ).toThrow(/rspack/);
    });
  });

  describe('deprecation warning', () => {
    it('should emit a deprecation warning for CJS projects', () => {
      vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(false);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('');

      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras(),
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('webpack compiler is deprecated'),
      );
    });

    it('should suggest rspack in the deprecation warning', () => {
      vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(false);
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('');

      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras(),
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('rspack'),
      );
    });
  });

  describe('run (CJS)', () => {
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

    it('should call webpackDefaultsFactory with correct arguments (no isEsm)', () => {
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('');

      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras(),
      );

      expect(vi.mocked(webpackDefaultsFactory)).toHaveBeenCalledWith(
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
      );
    });

    it('should call compiler.run for non-watch mode', () => {
      vi.mocked(getValueOrDefault)
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('');

      compiler.run(
        makeConfiguration(),
        'tsconfig.json',
        undefined,
        makeExtras({ watchMode: false }),
      );

      expect(mockRun).toHaveBeenCalled();
    });
  });
});
