import { BuildAction } from '../../actions/build.action';
import { Input } from '../../commands';
import { AssetsManager } from '../../lib/compiler/assets-manager';
import { Configuration } from '../../lib/configuration';

jest.mock('../../lib/compiler/helpers/get-tsc-config.path', () => ({
  getTscConfigPath: jest.fn(() => 'tsconfig.build.json'),
}));

jest.mock('../../lib/compiler/helpers/get-builder', () => ({
  getBuilder: jest.fn(() => ({ type: 'tsc' })),
}));

jest.mock('../../lib/compiler/helpers/delete-out-dir', () => ({
  deleteOutDirIfEnabled: jest.fn(async () => undefined),
}));

jest.mock('../../lib/compiler/helpers/tsconfig-provider', () => ({
  TsConfigProvider: jest.fn().mockImplementation(() => ({
    getByConfigFilename: jest.fn(() => ({
      options: { outDir: 'dist' },
    })),
  })),
}));

const mockCompilerRun = jest.fn();
jest.mock('../../lib/compiler/compiler', () => ({
  Compiler: jest.fn().mockImplementation(() => ({
    run: mockCompilerRun,
  })),
}));

class TestableBuildAction extends BuildAction {
  public configurationOverride!: Required<Configuration>;
  public copyAssetsCalls: Array<{
    appName: string | undefined;
    outDir: string;
  }> = [];

  constructor() {
    super();
    // Override the loader to return our injected configuration.
    (this as any).loader = {
      load: async () => this.configurationOverride,
    };
    // Replace the assets manager with a spy.
    const fakeAssetsManager = {
      copyAssets: (
        _config: Required<Configuration>,
        appName: string | undefined,
        outDir: string,
      ) => {
        this.copyAssetsCalls.push({ appName, outDir });
      },
      closeWatchers: jest.fn(),
    } as unknown as AssetsManager;
    (this as any).assetsManager = fakeAssetsManager;
  }
}

const baseConfig = (
  overrides: Partial<Configuration> = {},
): Required<Configuration> => ({
  language: 'ts',
  sourceRoot: 'apps/api/src',
  collection: '@nestjs/schematics',
  entryFile: 'main',
  exec: 'node',
  monorepo: true,
  projects: {},
  compilerOptions: {},
  generateOptions: {},
  ...overrides,
});

const buildOptions = (
  overrides: Record<string, boolean | string | string[] | undefined> = {},
): Input[] => {
  const defaults: Record<string, boolean | string | string[] | undefined> = {
    config: 'nest-cli.json',
    webpack: false,
    watch: false,
    watchAssets: false,
    path: undefined,
    webpackPath: undefined,
    builder: undefined,
    typeCheck: undefined,
    preserveWatchOutput: false,
    all: false,
    includeLibraryAssets: undefined,
  };
  const merged = { ...defaults, ...overrides };
  return Object.entries(merged).map(([name, value]) => ({
    name,
    value: value as boolean | string | string[],
  }));
};

describe('BuildAction - includeLibraryAssets', () => {
  let action: TestableBuildAction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCompilerRun.mockImplementation(() => undefined);
    action = new TestableBuildAction();
  });

  it('should only copy the app assets when includeLibraryAssets is not set (default)', async () => {
    action.configurationOverride = baseConfig({
      projects: {
        api: {
          type: 'application',
          sourceRoot: 'apps/api/src',
          compilerOptions: { assets: ['app-assets/*'] },
        },
        'my-lib': {
          type: 'library',
          sourceRoot: 'libs/my-lib/src',
          compilerOptions: { assets: ['library-assets/*'] },
        },
      },
    });

    await action.runBuild(
      [{ name: 'app', value: 'api' }],
      buildOptions(),
      false,
      false,
    );

    expect(action.copyAssetsCalls).toHaveLength(1);
    expect(action.copyAssetsCalls[0].appName).toEqual('api');
  });

  it('should copy library assets when includeLibraryAssets flag is true via CLI', async () => {
    action.configurationOverride = baseConfig({
      projects: {
        api: {
          type: 'application',
          sourceRoot: 'apps/api/src',
          compilerOptions: { assets: ['app-assets/*'] },
        },
        'my-lib': {
          type: 'library',
          sourceRoot: 'libs/my-lib/src',
          compilerOptions: { assets: ['library-assets/*'] },
        },
      },
    });

    await action.runBuild(
      [{ name: 'app', value: 'api' }],
      buildOptions({ includeLibraryAssets: true }),
      false,
      false,
    );

    expect(action.copyAssetsCalls).toHaveLength(2);
    expect(action.copyAssetsCalls[0].appName).toEqual('api');
    expect(action.copyAssetsCalls[1].appName).toEqual('my-lib');
    // Library assets should be copied into the app's outDir.
    expect(action.copyAssetsCalls[1].outDir).toEqual('dist');
  });

  it('should copy library assets when includeLibraryAssets is true in compilerOptions', async () => {
    action.configurationOverride = baseConfig({
      compilerOptions: { includeLibraryAssets: true },
      projects: {
        api: {
          type: 'application',
          sourceRoot: 'apps/api/src',
          compilerOptions: { assets: ['app-assets/*'] },
        },
        'my-lib': {
          type: 'library',
          sourceRoot: 'libs/my-lib/src',
          compilerOptions: { assets: ['library-assets/*'] },
        },
      },
    });

    await action.runBuild(
      [{ name: 'app', value: 'api' }],
      buildOptions(),
      false,
      false,
    );

    expect(action.copyAssetsCalls).toHaveLength(2);
    expect(action.copyAssetsCalls.map((c) => c.appName)).toEqual([
      'api',
      'my-lib',
    ]);
  });

  it('should copy assets from multiple libraries when configured', async () => {
    action.configurationOverride = baseConfig({
      projects: {
        api: {
          type: 'application',
          sourceRoot: 'apps/api/src',
          compilerOptions: { assets: ['app-assets/*'] },
        },
        'lib-one': {
          type: 'library',
          sourceRoot: 'libs/lib-one/src',
          compilerOptions: { assets: ['one/*.html'] },
        },
        'lib-two': {
          type: 'library',
          sourceRoot: 'libs/lib-two/src',
          compilerOptions: { assets: ['two/*.proto'] },
        },
      },
    });

    await action.runBuild(
      [{ name: 'app', value: 'api' }],
      buildOptions({ includeLibraryAssets: true }),
      false,
      false,
    );

    const names = action.copyAssetsCalls.map((c) => c.appName);
    expect(names).toContain('api');
    expect(names).toContain('lib-one');
    expect(names).toContain('lib-two');
    expect(action.copyAssetsCalls).toHaveLength(3);
  });

  it('should skip libraries without assets configured', async () => {
    action.configurationOverride = baseConfig({
      projects: {
        api: {
          type: 'application',
          sourceRoot: 'apps/api/src',
          compilerOptions: { assets: ['app-assets/*'] },
        },
        'lib-no-assets': {
          type: 'library',
          sourceRoot: 'libs/lib-no-assets/src',
          compilerOptions: {},
        },
        'lib-with-assets': {
          type: 'library',
          sourceRoot: 'libs/lib-with-assets/src',
          compilerOptions: { assets: ['files/*'] },
        },
      },
    });

    await action.runBuild(
      [{ name: 'app', value: 'api' }],
      buildOptions({ includeLibraryAssets: true }),
      false,
      false,
    );

    const names = action.copyAssetsCalls.map((c) => c.appName);
    expect(names).toEqual(['api', 'lib-with-assets']);
  });

  it('should not crash for a single-project (no monorepo) configuration when flag is enabled', async () => {
    action.configurationOverride = baseConfig({
      monorepo: false,
      projects: {},
      compilerOptions: {
        assets: ['app-assets/*'],
        includeLibraryAssets: true,
      },
    });

    await action.runBuild(
      [{ name: 'app', value: undefined as unknown as string }],
      buildOptions({ includeLibraryAssets: true }),
      false,
      false,
    );

    // Only the app's own assets call should occur.
    expect(action.copyAssetsCalls).toHaveLength(1);
    expect(action.copyAssetsCalls[0].appName).toBeUndefined();
  });

  it('should skip application-type sibling projects', async () => {
    action.configurationOverride = baseConfig({
      projects: {
        api: {
          type: 'application',
          sourceRoot: 'apps/api/src',
          compilerOptions: { assets: ['api-assets/*'] },
        },
        'second-app': {
          type: 'application',
          sourceRoot: 'apps/second-app/src',
          compilerOptions: { assets: ['second-assets/*'] },
        },
        'shared-lib': {
          type: 'library',
          sourceRoot: 'libs/shared-lib/src',
          compilerOptions: { assets: ['shared/*'] },
        },
      },
    });

    await action.runBuild(
      [{ name: 'app', value: 'api' }],
      buildOptions({ includeLibraryAssets: true }),
      false,
      false,
    );

    const names = action.copyAssetsCalls.map((c) => c.appName);
    // Only the current app + library projects should be copied.
    expect(names).toEqual(['api', 'shared-lib']);
    expect(names).not.toContain('second-app');
  });
});
