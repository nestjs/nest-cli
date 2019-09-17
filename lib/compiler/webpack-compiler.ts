import webpack = require('webpack');
import { Configuration } from '../configuration';
import { webpackDefaultsFactory } from './defaults/webpack-defaults';
import { PluginsLoader } from './plugins-loader';

export class WebpackCompiler {
  constructor(private readonly pluginsLoader: PluginsLoader) {}

  public run(
    configuration: Required<Configuration>,
    webpackConfig: Record<string, any>,
    watchMode = false,
    onSuccess?: () => void,
  ) {
    const tsConfigPath =
      configuration.compilerOptions &&
      configuration.compilerOptions.tsConfigPath;
    const plugins = this.pluginsLoader.load(
      configuration.compilerOptions.plugins || [],
    );

    const compiler = webpack({
      ...webpackDefaultsFactory(tsConfigPath, plugins),
      ...webpackConfig,
    } as any);

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
        console.log('Webpack is building your sources...');
        callback();
      });
      compiler.watch({}, afterCallback);
    } else {
      compiler.run(afterCallback);
    }
  }
}
