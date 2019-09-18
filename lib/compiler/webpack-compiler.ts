import chalk from 'chalk';
import { existsSync } from 'fs';
import { dirname, join, relative } from 'path';
import webpack = require('webpack');
import { Configuration } from '../configuration';
import { webpackDefaultsFactory } from './defaults/webpack-defaults';
import { PluginsLoader } from './plugins-loader';

export class WebpackCompiler {
  constructor(private readonly pluginsLoader: PluginsLoader) {}

  public run(
    configuration: Required<Configuration>,
    webpackConfigFactoryOrConfig: (
      config: webpack.Configuration,
    ) => webpack.Configuration,
    tsConfigPath: string,
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

    const plugins = this.pluginsLoader.load(
      configuration.compilerOptions.plugins || [],
    );
    const relativeRootPath = dirname(relative(cwd, configPath));
    const defaultOptions = webpackDefaultsFactory(
      join(cwd, relativeRootPath, configuration.sourceRoot),
      configuration.entryFile,
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
        warningsFilter: /^(?!CriticalDependenciesWarning$)/,
      });
      if (!err && !stats.hasErrors()) {
        onSuccess && onSuccess();
      }
      console.log(statsOutput);
    };

    if (watchMode) {
      compiler.hooks.watchRun.tapAsync('Rebuild info', (params, callback) => {
        console.log();
        console.log(chalk.green('Webpack is building your sources...'));
        callback();
      });
      compiler.watch({}, afterCallback);
    } else {
      compiler.run(afterCallback);
    }
  }
}
