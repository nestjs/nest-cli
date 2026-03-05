import { existsSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { Configuration } from '../configuration/index.js';
import { INFO_PREFIX } from '../ui/index.js';
import { AssetsManager } from './assets-manager.js';
import { BaseCompiler } from './base-compiler.js';
import { rspackDefaultsFactory } from './defaults/rspack-defaults.js';
import { getValueOrDefault } from './helpers/get-value-or-default.js';
import { PluginsLoader } from './plugins/plugins-loader.js';

const require = createRequire(import.meta.url);

type RspackConfigFactory = (
  config: Record<string, any>,
  rspackRef: any,
) => Record<string, any>;

type RspackConfigFactoryOrConfig = RspackConfigFactory | Record<string, any>;

type RspackCompilerExtras = {
  options: Record<string, any>;
  assetsManager: AssetsManager;
  rspackConfigFactoryOrConfig:
    | RspackConfigFactoryOrConfig
    | RspackConfigFactoryOrConfig[];
  debug?: boolean;
  watchMode?: boolean;
};

export class RspackCompiler extends BaseCompiler<RspackCompilerExtras> {
  constructor(pluginsLoader: PluginsLoader) {
    super(pluginsLoader);
  }

  public run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: RspackCompilerExtras,
    onSuccess?: () => void,
  ) {
    const cwd = process.cwd();
    const configPath = join(cwd, tsConfigPath!);
    if (!existsSync(configPath)) {
      throw new Error(
        `Could not find TypeScript configuration file "${tsConfigPath!}".`,
      );
    }

    const plugins = this.loadPlugins(configuration, tsConfigPath, appName);
    const pathToSource = this.getPathToSource(
      configuration,
      tsConfigPath,
      appName,
    );

    const entryFile = getValueOrDefault<string>(
      configuration,
      'entryFile',
      appName,
      'entryFile',
      extras.options,
    );
    const entryFileRoot =
      getValueOrDefault<string>(configuration, 'root', appName) || '';
    const defaultOptions = rspackDefaultsFactory(
      pathToSource,
      entryFileRoot,
      entryFile,
      extras.debug ?? false,
      tsConfigPath,
      plugins,
    );

    const rspack = require('@rspack/core');

    let compiler: any;
    let watchOptions: any;
    let watch: boolean | undefined;

    if (Array.isArray(extras.rspackConfigFactoryOrConfig)) {
      const rspackConfigurations = extras.rspackConfigFactoryOrConfig.map(
        (configOrFactory) => {
          const unwrappedConfig =
            typeof configOrFactory !== 'function'
              ? configOrFactory
              : configOrFactory(defaultOptions, rspack);
          return {
            ...defaultOptions,
            mode: extras.watchMode ? 'development' : defaultOptions.mode,
            ...unwrappedConfig,
          };
        },
      );
      compiler = rspack.rspack(rspackConfigurations);
      watchOptions = rspackConfigurations.map(
        (config: any) => config.watchOptions || {},
      );
      watch = rspackConfigurations.some((config: any) => config.watch);
    } else {
      const projectRspackOptions =
        typeof extras.rspackConfigFactoryOrConfig !== 'function'
          ? extras.rspackConfigFactoryOrConfig
          : extras.rspackConfigFactoryOrConfig(defaultOptions, rspack);
      const rspackConfiguration = {
        ...defaultOptions,
        mode: extras.watchMode ? 'development' : defaultOptions.mode,
        ...projectRspackOptions,
      };
      compiler = rspack.rspack(rspackConfiguration);
      watchOptions = rspackConfiguration.watchOptions;
      watch = rspackConfiguration.watch;
    }

    const afterCallback = this.createAfterCallback(
      onSuccess,
      extras.assetsManager,
      extras.watchMode ?? false,
      watch,
    );

    if (extras.watchMode || watch) {
      compiler.hooks.watchRun.tapAsync(
        'Rebuild info',
        (params: any, callback: () => void) => {
          console.log(`\n${INFO_PREFIX} Rspack is building your sources...\n`);
          callback();
        },
      );
      compiler.watch(watchOptions! || {}, afterCallback);
    } else {
      compiler.run(afterCallback);
    }
  }

  private createAfterCallback(
    onSuccess: (() => void) | undefined,
    assetsManager: AssetsManager,
    watchMode: boolean,
    watch: boolean | undefined,
  ) {
    return (err: Error | null | undefined, stats: any | undefined) => {
      if (err && stats === undefined) {
        // Could not complete the compilation
        // The error caught is most likely thrown by underlying tasks
        console.log(err);
        return process.exit(1);
      }
      const statsOutput = stats!.toString({
        chunks: false,
        colors: true,
        modules: false,
        assets: false,
      });
      if (!err && !stats!.hasErrors()) {
        if (!onSuccess) {
          assetsManager.closeWatchers();
        } else {
          onSuccess();
        }
      } else if (!watchMode && !watch) {
        console.log(statsOutput);
        return process.exit(1);
      }
      console.log(statsOutput);
    };
  }
}
