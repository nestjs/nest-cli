import { existsSync } from 'fs';
import { join } from 'path';
import { Input } from '../../commands';
import { Configuration } from '../configuration';
import { INFO_PREFIX } from '../ui';
import { AssetsManager } from './assets-manager';
import { BaseCompiler } from './base-compiler';
import { webpackDefaultsFactory } from './defaults/webpack-defaults';
import { getValueOrDefault } from './helpers/get-value-or-default';
import { PluginsLoader } from './plugins/plugins-loader';
import webpack = require('webpack');

type WebpackConfigFactory = (
  config: webpack.Configuration,
  webpackRef: typeof webpack,
) => webpack.Configuration;

type WebpackConfigFactoryOrConfig =
  | WebpackConfigFactory
  | webpack.Configuration;

type WebpackCompilerExtras = {
  inputs: Input[];
  assetsManager: AssetsManager;
  webpackConfigFactoryOrConfig:
    | WebpackConfigFactoryOrConfig
    | WebpackConfigFactoryOrConfig[];
  debug?: boolean;
  watchMode?: boolean;
};

export class WebpackCompiler extends BaseCompiler<WebpackCompilerExtras> {
  constructor(pluginsLoader: PluginsLoader) {
    super(pluginsLoader);
  }

  public run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string,
    extras: WebpackCompilerExtras,
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
      extras.inputs,
    );
    const entryFileRoot =
      getValueOrDefault<string>(configuration, 'root', appName) || '';
    const defaultOptions = webpackDefaultsFactory(
      pathToSource,
      entryFileRoot,
      entryFile,
      extras.debug ?? false,
      tsConfigPath,
      plugins,
    );

    let compiler: webpack.Compiler | webpack.MultiCompiler;
    let watchOptions:
      | Parameters<typeof webpack.MultiCompiler.prototype.watch>[0]
      | undefined;
    let watch: boolean | undefined;

    if (Array.isArray(extras.webpackConfigFactoryOrConfig)) {
      const webpackConfigurations = extras.webpackConfigFactoryOrConfig.map(
        (configOrFactory) => {
          const unwrappedConfig =
            typeof configOrFactory !== 'function'
              ? configOrFactory
              : configOrFactory(defaultOptions, webpack);
          return {
            ...defaultOptions,
            mode: extras.watchMode ? 'development' : defaultOptions.mode,
            ...unwrappedConfig,
          };
        },
      );
      compiler = webpack(webpackConfigurations);
      watchOptions = webpackConfigurations.map(
        (config) => config.watchOptions || {},
      );
      watch = webpackConfigurations.some((config) => config.watch);
    } else {
      const projectWebpackOptions =
        typeof extras.webpackConfigFactoryOrConfig !== 'function'
          ? extras.webpackConfigFactoryOrConfig
          : extras.webpackConfigFactoryOrConfig(defaultOptions, webpack);
      const webpackConfiguration = {
        ...defaultOptions,
        mode: extras.watchMode ? 'development' : defaultOptions.mode,
        ...projectWebpackOptions,
      };
      compiler = webpack(webpackConfiguration);
      watchOptions = webpackConfiguration.watchOptions;
      watch = webpackConfiguration.watch;
    }

    const afterCallback = this.createAfterCallback(
      onSuccess,
      extras.assetsManager,
      extras.watchMode ?? false,
      watch,
    );

    if (extras.watchMode || watch) {
      compiler.hooks.watchRun.tapAsync('Rebuild info', (params, callback) => {
        console.log(`\n${INFO_PREFIX} Webpack is building your sources...\n`);
        callback();
      });
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
    return (
      err: Error | null | undefined,
      stats: webpack.Stats | webpack.MultiStats | undefined,
    ) => {
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
