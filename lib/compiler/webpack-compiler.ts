import { existsSync } from 'fs';
import { dirname, join, relative } from 'path';
import webpack = require('webpack');
import { Configuration } from '../configuration';
import { INFO_PREFIX } from '../ui';
import { webpackDefaultsFactory } from './defaults/webpack-defaults';
import { getValueOrDefault } from './helpers/get-value-or-default';
import { PluginsLoader } from './plugins-loader';

export class WebpackCompiler {
  constructor(private readonly pluginsLoader: PluginsLoader) {}

  public run(
    configuration: Required<Configuration>,
    webpackConfigFactoryOrConfig: (
      config: webpack.Configuration,
    ) => webpack.Configuration,
    tsConfigPath: string,
    appName: string,
    isDebugEnabled = false,
    watchMode = false,
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
      sourceRoot.indexOf(relativeRootPath) >= 0
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

    const compiler = webpack({
      ...defaultOptions,
      ...projectWebpackOptions,
    });

    const afterCallback = (err: Error, stats: any) => {
      const statsOutput = stats.toString({
        chunks: false,
        colors: true,
        modules: false,
        assets: false,
        warningsFilter: /^(?!CriticalDependenciesWarning$)/,
      });
      if (!err && !stats.hasErrors()) {
        onSuccess && onSuccess();
      }
      console.log(statsOutput);
    };

    if (watchMode) {
      compiler.hooks.watchRun.tapAsync('Rebuild info', (params, callback) => {
        console.log(`\n${INFO_PREFIX} Webpack is building your sources...\n`);
        callback();
      });
      compiler.watch({}, afterCallback);
    } else {
      compiler.run(afterCallback);
    }
  }
}
