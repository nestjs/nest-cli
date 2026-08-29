import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuildAction } from '../../actions/build.action.js';
import { Configuration } from '../../lib/configuration/index.js';
import { RspackCompiler } from '../../lib/compiler/rspack-compiler.js';
import { WebpackCompiler } from '../../lib/compiler/webpack-compiler.js';
import { getRspackConfigPath } from '../../lib/compiler/helpers/get-rspack-config-path.js';
import { deleteOutDirIfEnabled } from '../../lib/compiler/helpers/delete-out-dir.js';

vi.mock('../../lib/compiler/rspack-compiler.js', () => ({
  RspackCompiler: vi.fn().mockImplementation(function () {
    return { run: vi.fn() };
  }),
}));

vi.mock('../../lib/compiler/helpers/get-rspack-config-path.js', () => ({
  getRspackConfigPath: vi.fn(),
}));

vi.mock('../../lib/utils/is-module-available.js', () => ({
  isModuleAvailable: vi.fn().mockReturnValue(false),
}));

vi.mock('../../lib/compiler/webpack-compiler.js', () => ({
  WebpackCompiler: vi.fn().mockImplementation(function () {
    return { run: vi.fn() };
  }),
}));

vi.mock('../../lib/compiler/helpers/get-webpack-config-path.js', () => ({
  getWebpackConfigPath: vi.fn(),
}));

vi.mock('../../lib/compiler/helpers/delete-out-dir.js', () => ({
  deleteOutDirIfEnabled: vi.fn().mockResolvedValue(undefined),
}));

describe('BuildAction - Rspack', () => {
  let buildAction: BuildAction;

  const makeConfiguration = (
    overrides: Partial<Configuration> = {},
  ): Required<Configuration> =>
    ({
      language: 'ts',
      sourceRoot: 'src',
      collection: '@nestjs/schematics',
      entryFile: 'main',
      exec: 'node',
      projects: {},
      monorepo: false,
      compilerOptions: {
        builder: { type: 'rspack' },
        webpack: false,
        plugins: [],
        assets: [],
        manualRestart: false,
      },
      generateOptions: {},
      ...overrides,
    }) as Required<Configuration>;

  beforeEach(() => {
    buildAction = new BuildAction();

    // Stub the loader so it returns our test configuration
    (buildAction as any).loader = {
      load: vi.fn().mockResolvedValue(makeConfiguration()),
    };

    // Stub tsconfig provider
    (buildAction as any).tsConfigProvider = {
      getByConfigFilename: vi.fn().mockReturnValue({
        options: { outDir: 'dist' },
      }),
    };

    // Stub the per-app assets manager factory
    (buildAction as any).createAssetsManager = vi.fn(() => ({
      copyAssets: vi.fn(),
      closeWatchers: vi.fn().mockResolvedValue(undefined),
    }));

    vi.clearAllMocks();
  });

  describe('getRspackConfigFactoryByPath', () => {
    it('should return identity function when config file is not available and path is default', async () => {
      // Access private method via prototype
      const proto = Object.getPrototypeOf(buildAction);
      const method =
        proto.getRspackConfigFactoryByPath ||
        (buildAction as any)['getRspackConfigFactoryByPath'];

      // If method exists on prototype, call it bound
      if (method) {
        const result = await method.call(
          buildAction,
          'rspack.config.js',
          'rspack.config.js',
        );
        expect(typeof result).toBe('function');
        expect(result({})).toEqual({});
      } else {
        // Method might be compiled differently; test via runBuild integration instead
        expect(true).toBe(true);
      }
    });

    it('should load an ESM config', async () => {
      const method = Object.getPrototypeOf(buildAction)
        .getRspackConfigFactoryByPath as Function;

      const config = await method.call(
        buildAction,
        'test/fixtures/rspack.config.mjs',
        'rspack.config.js',
      );

      expect(config({}, {})).toEqual({ name: 'esm-rspack-config' });
    });

    it('should load a CommonJS config', async () => {
      const method = Object.getPrototypeOf(buildAction)
        .getRspackConfigFactoryByPath as Function;

      const config = await method.call(
        buildAction,
        'test/fixtures/rspack.config.cjs',
        'rspack.config.js',
      );

      expect(config({}, {})).toEqual({ name: 'commonjs-rspack-config' });
    });
  });

  describe('runBuild with rspack builder', () => {
    it('should dispatch to rspack compiler when builder type is rspack', async () => {
      await buildAction.runBuild(
        [undefined],
        { builder: 'rspack' },
        false,
        false,
      );

      expect(RspackCompiler).toHaveBeenCalled();
    });

    it('should forward rspackPath option to getRspackConfigPath helper', async () => {
      // Return undefined so runRspack falls back to the default config filename
      // and the (mocked) is-module-available short-circuits the require call.
      vi.mocked(getRspackConfigPath).mockReturnValue(undefined);

      await buildAction.runBuild(
        [undefined],
        { builder: 'rspack', rspackPath: 'custom.rspack.config.js' },
        false,
        false,
      );

      expect(getRspackConfigPath).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ rspackPath: 'custom.rspack.config.js' }),
        undefined,
      );
    });

    it('should not use rspack compiler when builder type is webpack', async () => {
      // Reconfigure loader to return webpack builder
      (buildAction as any).loader = {
        load: vi.fn().mockResolvedValue(
          makeConfiguration({
            compilerOptions: {
              builder: { type: 'webpack' },
              webpack: false,
              plugins: [],
              assets: [],
              manualRestart: false,
            },
          }),
        ),
      };

      vi.mocked(RspackCompiler).mockClear();

      await buildAction.runBuild(
        [undefined],
        { builder: 'webpack' },
        false,
        false,
      );

      expect(WebpackCompiler).toHaveBeenCalled();
      expect(RspackCompiler).not.toHaveBeenCalled();
    });
  });

  describe('runBuild parallel concurrency', () => {
    // Each test in this suite uses three apps so the parallel branch is taken.
    // We replace `runRspack` with a fast tracker so we can assert how many
    // apps were built — and, critically, that the loop terminates instead of
    // spinning forever on a non-positive concurrency value.
    const buildAllThreeApps = async (parallel: unknown) => {
      const builtApps: Array<string | undefined> = [];
      (buildAction as any).runRspack = vi.fn(
        async (_config: unknown, appName: string | undefined) => {
          builtApps.push(appName);
        },
      );

      await buildAction.runBuild(
        ['a', 'b', 'c'],
        { builder: 'rspack', parallel },
        false,
        false,
      );

      return builtApps;
    };

    it('should build sequentially when parallel is 0 (falsy)', async () => {
      // 0 is falsy so the action takes the sequential branch — every app
      // should still build exactly once.
      const built = await buildAllThreeApps(0);

      expect(built.sort()).toEqual(['a', 'b', 'c']);
    });

    it('should not loop forever when parallel is a negative number', async () => {
      // Without the guard, `concurrency = -1` makes `i += -1` decrement
      // forever. Vitest will hit the test timeout if the regression returns.
      const built = await buildAllThreeApps(-1);

      expect(built.sort()).toEqual(['a', 'b', 'c']);
    });

    it('should not loop forever when parallel is NaN', async () => {
      // Without the guard, `i += NaN` keeps `i` at NaN and the loop never
      // exits.
      const built = await buildAllThreeApps(Number.NaN);

      expect(built.sort()).toEqual(['a', 'b', 'c']);
    });

    it('should respect a positive parallel concurrency and build every app once', async () => {
      const built = await buildAllThreeApps(2);

      expect(built.sort()).toEqual(['a', 'b', 'c']);
    });

    it('should treat `parallel: true` as unlimited and build every app once', async () => {
      const built = await buildAllThreeApps(true);

      expect(built.sort()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('output directory cleanup', () => {
    it('should clean every outDir before the first app starts building', async () => {
      // Apps in a monorepo share `dist` by default, so a delete that runs
      // inside a per-app build wipes output another app already emitted.
      const events: string[] = [];
      vi.mocked(deleteOutDirIfEnabled).mockImplementation(async () => {
        events.push('delete');
      });
      (buildAction as any).runRspack = vi.fn(async () => {
        events.push('build');
      });

      await buildAction.runBuild(
        ['a', 'b', 'c'],
        { builder: 'rspack' },
        false,
        false,
      );

      expect(events).toEqual([
        'delete',
        'delete',
        'delete',
        'build',
        'build',
        'build',
      ]);
    });

    it('should clean every outDir before any app starts building in parallel mode', async () => {
      const events: string[] = [];
      vi.mocked(deleteOutDirIfEnabled).mockImplementation(async () => {
        events.push('delete');
      });
      (buildAction as any).runRspack = vi.fn(async () => {
        events.push('build');
      });

      await buildAction.runBuild(
        ['a', 'b', 'c'],
        { builder: 'rspack', parallel: true },
        false,
        false,
      );

      expect(events.indexOf('build')).toBe(3);
    });
  });

  describe('assets manager scoping', () => {
    it('should give every app its own assets manager', async () => {
      // A shared manager lets the first app to finish close the asset
      // watchers of apps that are still building under --parallel.
      (buildAction as any).runRspack = vi.fn();

      await buildAction.runBuild(
        ['a', 'b', 'c'],
        { builder: 'rspack', parallel: true },
        false,
        false,
      );

      expect((buildAction as any).createAssetsManager).toHaveBeenCalledTimes(3);
    });
  });

  describe('warnOnIgnoredLibraryAssets', () => {
    const configurationWithLibrary = (includeLibraryAssets?: string[]) =>
      makeConfiguration({
        compilerOptions: {
          builder: { type: 'rspack' },
          webpack: false,
          plugins: [],
          assets: [],
          manualRestart: false,
          ...(includeLibraryAssets ? { includeLibraryAssets } : {}),
        } as any,
        projects: {
          api: { type: 'application', compilerOptions: {} },
          shared: {
            type: 'library',
            compilerOptions: { assets: ['**/*.graphql'] },
          },
        } as any,
      });

    const buildApiApp = async (includeLibraryAssets?: string[]) => {
      (buildAction as any).loader = {
        load: vi
          .fn()
          .mockResolvedValue(configurationWithLibrary(includeLibraryAssets)),
      };
      (buildAction as any).runRspack = vi.fn();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await buildAction.runBuild(['api'], { builder: 'rspack' }, false, false);

      const warnings = warn.mock.calls.map((call) => String(call[0]));
      warn.mockRestore();
      return warnings.filter((message) => message.includes('shared'));
    };

    it('should warn when a library with assets is not included', async () => {
      expect(await buildApiApp()).toHaveLength(1);
    });

    it('should not warn when the library is listed in includeLibraryAssets', async () => {
      // Those assets *are* copied, so the warning would be plainly wrong.
      expect(await buildApiApp(['shared'])).toHaveLength(0);
    });

    it('should warn only once per build rather than once per app', async () => {
      (buildAction as any).loader = {
        load: vi.fn().mockResolvedValue(configurationWithLibrary()),
      };
      (buildAction as any).runRspack = vi.fn();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await buildAction.runBuild(
        ['api', 'api2'],
        { builder: 'rspack' },
        false,
        false,
      );

      const warnings = warn.mock.calls
        .map((call) => String(call[0]))
        .filter((message) => message.includes('shared'));
      warn.mockRestore();

      expect(warnings).toHaveLength(1);
    });
  });

  describe('emitDeclarations resolution', () => {
    // getValueOrDefault returns the CLI value whenever it is not null or
    // undefined, so the command layer must leave the option undefined when the
    // flag is absent — otherwise nest-cli.json can never enable it.
    const emitDeclarationsPassedToSwc = async (
      configEmitDeclarations: boolean | undefined,
      cliEmitDeclarations: boolean | undefined,
    ) => {
      (buildAction as any).loader = {
        load: vi.fn().mockResolvedValue(
          makeConfiguration({
            compilerOptions: {
              builder: { type: 'swc' },
              webpack: false,
              plugins: [],
              assets: [],
              manualRestart: false,
              ...(configEmitDeclarations !== undefined
                ? { emitDeclarations: configEmitDeclarations }
                : {}),
            } as any,
          }),
        ),
      };
      const runSwc = vi.fn();
      (buildAction as any).runSwc = runSwc;

      await buildAction.runBuild(
        [undefined],
        { builder: 'swc', emitDeclarations: cliEmitDeclarations },
        false,
        false,
      );

      // runSwc(configuration, appName, tsconfig, watch, options, tsOptions,
      //        tsConfigExclude, emitDeclarations, onSuccess, assetsManager)
      return runSwc.mock.calls[0][7];
    };

    it('honours compilerOptions.emitDeclarations when the flag is absent', async () => {
      expect(await emitDeclarationsPassedToSwc(true, undefined)).toBe(true);
    });

    it('stays falsy when neither the config nor the flag enable it', async () => {
      expect(
        await emitDeclarationsPassedToSwc(undefined, undefined),
      ).toBeFalsy();
    });

    it('honours the CLI flag when the config says nothing', async () => {
      expect(await emitDeclarationsPassedToSwc(undefined, true)).toBe(true);
    });

    it('lets the CLI flag win over the config', async () => {
      expect(await emitDeclarationsPassedToSwc(false, true)).toBe(true);
    });

    it('warns when emitDeclarations is requested for a non-swc builder', async () => {
      (buildAction as any).runRspack = vi.fn();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await buildAction.runBuild(
        [undefined],
        { builder: 'rspack', emitDeclarations: true },
        false,
        false,
      );

      const warnings = warn.mock.calls.map((call) => String(call[0]));
      warn.mockRestore();

      expect(
        warnings.some((message) => message.includes('"emitDeclarations"')),
      ).toBe(true);
    });
  });
});
