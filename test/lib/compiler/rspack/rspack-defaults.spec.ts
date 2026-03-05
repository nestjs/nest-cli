import { describe, it, expect, vi } from 'vitest';
import { createRequire as realCreateRequire } from 'module';
import { rspackDefaultsFactory } from '../../../../lib/compiler/defaults/rspack-defaults.js';
import { MultiNestCompilerPlugins } from '../../../../lib/compiler/plugins/plugins-loader.js';

// Hoist mocks so they can be referenced in vi.mock factories
const { mockIgnorePlugin, mockForkTsChecker, mockNodeExternals, mockTsconfigPathsPlugin } = vi.hoisted(() => ({
  mockIgnorePlugin: vi.fn().mockImplementation((opts: any) => ({
    __type: 'IgnorePlugin',
    ...opts,
  })),
  mockForkTsChecker: vi.fn().mockImplementation((opts: any) => ({
    __type: 'ForkTsCheckerWebpackPlugin',
    ...opts,
  })),
  mockNodeExternals: vi.fn().mockReturnValue('mocked-externals'),
  mockTsconfigPathsPlugin: vi.fn().mockImplementation((opts: any) => ({
    __type: 'TsconfigPathsPlugin',
    ...opts,
  })),
}));

// Mock ESM imports
vi.mock('tsconfig-paths-webpack-plugin', () => ({
  TsconfigPathsPlugin: mockTsconfigPathsPlugin,
}));

vi.mock('webpack-node-externals', () => ({
  default: mockNodeExternals,
}));

// Mock createRequire to intercept CJS require('@rspack/core') and require('fork-ts-checker-webpack-plugin')
vi.mock('module', async (importOriginal) => {
  const actual = await importOriginal<typeof import('module')>();
  return {
    ...actual,
    createRequire: (url: string | URL) => {
      const realReq = actual.createRequire(url);
      const mockedReq: any = (id: string) => {
        if (id === '@rspack/core') return { IgnorePlugin: mockIgnorePlugin };
        if (id === 'fork-ts-checker-webpack-plugin') return mockForkTsChecker;
        return realReq(id);
      };
      mockedReq.resolve = realReq.resolve.bind(realReq);
      mockedReq.resolve.paths = realReq.resolve.paths?.bind(realReq.resolve);
      return mockedReq;
    },
  };
});

describe('rspackDefaultsFactory', () => {
  const emptyPlugins: MultiNestCompilerPlugins = {
    beforeHooks: [],
    afterHooks: [],
    afterDeclarationsHooks: [],
    readonlyVisitors: [],
  };

  const registeredPlugins: MultiNestCompilerPlugins = {
    beforeHooks: [vi.fn()],
    afterHooks: [],
    afterDeclarationsHooks: [],
    readonlyVisitors: [],
  };

  it('should return a configuration object with correct entry', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.entry).toContain('src');
    expect(config.entry).toContain('main');
    expect(config.entry).toMatch(/\.ts$/);
  });

  it('should target node', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.target).toBe('node');
  });

  it('should set devtool to false when debug is disabled', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.devtool).toBe(false);
  });

  it('should set devtool to inline-source-map when debug is enabled', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      true,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.devtool).toBe('inline-source-map');
  });

  it('should use builtin:swc-loader for TypeScript files', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    const rule = config.module.rules[0];
    expect(rule.test).toEqual(/\.tsx?$/);
    expect(rule.use[0].loader).toBe('builtin:swc-loader');
  });

  it('should configure SWC loader with TypeScript and decorator support', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    const loaderOptions = config.module.rules[0].use[0].options;
    expect(loaderOptions.jsc.parser.syntax).toBe('typescript');
    expect(loaderOptions.jsc.parser.decorators).toBe(true);
    expect(loaderOptions.jsc.transform.legacyDecorator).toBe(true);
    expect(loaderOptions.jsc.transform.decoratorMetadata).toBe(true);
  });

  it('should resolve .tsx, .ts, and .js extensions', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.resolve.extensions).toEqual(['.tsx', '.ts', '.js']);
  });

  it('should set mode to none', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.mode).toBe('none');
  });

  it('should set nodeEnv optimization to false', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.optimization.nodeEnv).toBe(false);
  });

  it('should preserve __filename and __dirname behavior', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.node.__filename).toBe(false);
    expect(config.node.__dirname).toBe(false);
  });

  it('should use webpack-node-externals', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.externals).toContain('mocked-externals');
    expect(config.externalsPresets).toEqual({ node: true });
  });

  it('should set tsConfig in resolve when tsconfig file is provided', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'custom-tsconfig.json',
      emptyPlugins,
    );

    expect(config.resolve.tsConfig).toBe('custom-tsconfig.json');
  });

  it('should include TsconfigPathsPlugin', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.resolve.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ __type: 'TsconfigPathsPlugin' }),
      ]),
    );
  });

  it('should include IgnorePlugin from @rspack/core', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    const ignorePlugin = config.plugins.find(
      (p: any) => p.__type === 'IgnorePlugin',
    );
    expect(ignorePlugin).toBeDefined();
  });

  it('should include ForkTsCheckerWebpackPlugin when no custom plugins', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    const forkPlugin = config.plugins.find(
      (p: any) => p.__type === 'ForkTsCheckerWebpackPlugin',
    );
    expect(forkPlugin).toBeDefined();
  });

  it('should not include ForkTsCheckerWebpackPlugin when custom plugins are registered', () => {
    const config = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      registeredPlugins,
    );

    const forkPlugin = config.plugins.find(
      (p: any) => p.__type === 'ForkTsCheckerWebpackPlugin',
    );
    expect(forkPlugin).toBeUndefined();
  });

  it('should set output filename based on relativeSourceRoot and entryFilename', () => {
    const config = rspackDefaultsFactory(
      'src',
      'apps/my-app',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );

    expect(config.output.filename).toContain('apps/my-app');
    expect(config.output.filename).toContain('main.js');
  });

  it('should set sourceMaps in swc-loader based on debug flag', () => {
    const debugConfig = rspackDefaultsFactory(
      'src',
      '',
      'main',
      true,
      'tsconfig.json',
      emptyPlugins,
    );
    expect(debugConfig.module.rules[0].use[0].options.sourceMaps).toBe(true);

    const releaseConfig = rspackDefaultsFactory(
      'src',
      '',
      'main',
      false,
      'tsconfig.json',
      emptyPlugins,
    );
    expect(releaseConfig.module.rules[0].use[0].options.sourceMaps).toBe(false);
  });
});
