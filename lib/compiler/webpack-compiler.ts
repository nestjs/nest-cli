import { existsSync } from 'fs';
import { dirname, join, normalize, relative } from 'path';
import { Configuration } from '../configuration';
import { INFO_PREFIX } from '../ui';
import { AssetsManager } from './assets-manager';
import { webpackDefaultsFactory } from './defaults/webpack-defaults';
import { getValueOrDefault } from './helpers/get-value-or-default';
import { PluginsLoader } from './plugins-loader';
import webpack = require('webpack');

type WebpackConfigFactory = (
  config: webpack.Configuration,
  webpackRef: typeof webpack,
) => webpack.Configuration;

type WebpackConfigFactoryOrConfig =
  | WebpackConfigFactory
  | webpack.Configuration;

export class WebpackCompiler {
  constructor(private readonly pluginsLoader: PluginsLoader) {}

  public run(
    configuration: Required<Configuration>,
    webpackConfigFactoryOrConfig:
      | WebpackConfigFactoryOrConfig
      | WebpackConfigFactoryOrConfig[],
    tsConfigPath: string,
    appName: string,
    isDebugEnabled = false,
    watchMode = false,
    assetsManager: AssetsManager,
    onSuccess?: () => void,
  ) {
    const cwd = process.cwd();
    const configPath = join(cwd, tsConfigPath!);
    if (!existsSync(configPath)) {
      throw new Error(
        `Could not find TypeScript configuration file "${tsConfigPath!}".`,
      );
    }

    const pluginsConfig = getValueOrDefault(
      configuration,
      'compilerOptions.plugins',
      appName,
    );
    const plugins = this.pluginsLoader.load(pluginsConfig);
    const relativeRootPath = dirname(relative(cwd, configPath));
    const sourceRoot = getValueOrDefault<string>(
      configuration,
      'sourceRoot',
      appName,
    );
    const pathToSource =
      normalize(sourceRoot).indexOf(normalize(relativeRootPath)) >= 0
        ? join(cwd, sourceRoot)
        : join(cwd, relativeRootPath, sourceRoot);

    const entryFile = getValueOrDefault<string>(
      configuration,
      'entryFile',
      appName,
    );
    const entryFileRoot =
      getValueOrDefault<string>(configuration, 'root', appName) || '';
    const defaultOptions = webpackDefaultsFactory(
      pathToSource,
      entryFileRoot,
      entryFile,
      isDebugEnabled,
      tsConfigPath,
      plugins,
    );

    let compiler: webpack.Compiler | webpack.MultiCompiler;
    let watchOptions:
      | Parameters<typeof webpack.MultiCompiler.prototype.watch>[0]
      | undefined;
    let watch: boolean | undefined;

    if (Array.isArray(webpackConfigFactoryOrConfig)) {
      const webpackConfigurations = webpackConfigFactoryOrConfig.map(
        (configOrFactory) => {
          const unwrappedConfig =
            typeof configOrFactory !== 'function'
              ? configOrFactory
              : configOrFactory(defaultOptions, webpack);
          return {
            ...defaultOptions,
            mode: watchMode ? 'development' : defaultOptions.mode,
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
        typeof webpackConfigFactoryOrConfig !== 'function'
          ? webpackConfigFactoryOrConfig
          : webpackConfigFactoryOrConfig(defaultOptions, webpack);
      const webpackConfiguration = {
        ...defaultOptions,
        mode: watchMode ? 'development' : defaultOptions.mode,
        ...projectWebpackOptions,
      };
      compiler = webpack(webpackConfiguration);
      watchOptions = webpackConfiguration.watchOptions;
      watch = webpackConfiguration.watch;
    }

    const afterCallback = (
      err: Error | undefined,
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
        warningsFilter: /^(?!CriticalDependenciesWarning$)/,
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

    if (watchMode || watch) {
      compiler.hooks.watchRun.tapAsync('Rebuild info', (params, callback) => {
        console.log(`\n${INFO_PREFIX} Webpack is building your sources...\n`);
        callback();
      });
      compiler.watch(watchOptions! || {}, afterCallback);
    } else {
      compiler.run(afterCallback);
    }
  }
}
