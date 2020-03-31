import { existsSync } from 'fs';
import { dirname, join, normalize, relative } from 'path';
import webpack = require('webpack');

import { Configuration } from '../configuration';
import { INFO_PREFIX } from '../ui';
import { AssetsManager } from './assets-manager';
import { webpackDefaultsFactory } from './defaults/webpack-defaults';
import { getValueOrDefault } from './helpers/get-value-or-default';
import { PluginsLoader } from './plugins-loader';

export class WebpackCompiler {
  constructor(private readonly pluginsLoader: PluginsLoader) {}

  public run(
    configuration: Required<Configuration>,
    webpackConfigFactoryOrConfig: (
      config: webpack.Configuration,
    ) => webpack.Configuration | webpack.Configuration[],
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
    const projectWebpackOptions =
      typeof webpackConfigFactoryOrConfig !== 'function'
        ? webpackConfigFactoryOrConfig
        : webpackConfigFactoryOrConfig(defaultOptions);

    let webpackConfiguration: webpack.Configuration | webpack.Configuration[];

    if (Array.isArray(projectWebpackOptions)) {
      webpackConfiguration = projectWebpackOptions.map((projectWebpackOptionsItem) => ({
        ...defaultOptions,
        ...projectWebpackOptionsItem,
      }));
    } else {
      webpackConfiguration = {
        ...defaultOptions,
        ...projectWebpackOptions,
      };
    }

    const compiler = webpack(webpackConfiguration);

    const afterCallback = (err: Error, stats: any) => {
      const statsOutput = stats.toString({
        chunks: false,
        colors: true,
        modules: false,
        assets: false,
        warningsFilter: /^(?!CriticalDependenciesWarning$)/,
      });
      if (!err && !stats.hasErrors()) {
        if (!onSuccess) {
          assetsManager.closeWatchers();
        } else {
          onSuccess();
        }
      } else if (!watchMode && !webpackConfiguration.watch) {
        console.log(statsOutput);
        return process.exit(1);
      }
      console.log(statsOutput);
    };

    if (watchMode || webpackConfiguration.watch) {
      compiler.hooks.watchRun.tapAsync('Rebuild info', (params, callback) => {
        console.log(`\n${INFO_PREFIX} Webpack is building your sources...\n`);
        callback();
      });
      compiler.watch(webpackConfiguration.watchOptions! || {}, afterCallback);
    } else {
      compiler.run(afterCallback);
    }
  }
}
