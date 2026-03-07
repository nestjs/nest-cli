import { existsSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { Configuration } from '../configuration/index.js';
import { INFO_PREFIX } from '../ui/index.js';
import { isEsmProject } from '../utils/is-esm-project.js';
import { AssetsManager } from './assets-manager.js';
import { BaseCompiler } from './base-compiler.js';
import { webpackDefaultsFactory } from './defaults/webpack-defaults.js';
import { getValueOrDefault } from './helpers/get-value-or-default.js';
import { PluginsLoader } from './plugins/plugins-loader.js';
import type webpack from 'webpack';

const WEBPACK_DEPRECATION_MSG =
  'The webpack compiler is deprecated and will be removed in a future major version. ' +
  'Please migrate to rspack (--builder rspack). ' +
  'See https://docs.nestjs.com/cli/usages#build for details.';

const require = createRequire(import.meta.url);

function loadWebpack(): typeof webpack {
  try {
    return require('webpack');
  } catch {
    throw new Error(
      'webpack is not installed. To use the webpack compiler, install the required packages:\n\n' +
        '  npm install --save-dev webpack webpack-node-externals tsconfig-paths-webpack-plugin ts-loader\n',
    );
  }
}

type WebpackConfigFactory = (
  config: webpack.Configuration,
  webpackRef: typeof webpack,
) => webpack.Configuration;

type WebpackConfigFactoryOrConfig =
  | WebpackConfigFactory
  | webpack.Configuration;

type WebpackCompilerExtras = {
  options: Record<string, any>;
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
    appName: string | undefined,
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
      extras.options,
    );
    const entryFileRoot =
      getValueOrDefault<string>(configuration, 'root', appName) || '';

    if (isEsmProject()) {
      throw new Error(
        'The webpack compiler does not support ESM projects ("type": "module" in package.json). ' +
          'Please use rspack instead by setting "builder": "rspack" in your nest-cli.json compilerOptions, ' +
          'or use --builder rspack on the command line.',
      );
    }

    console.warn(`\n${INFO_PREFIX} ${WEBPACK_DEPRECATION_MSG}\n`);

    const defaultOptions = webpackDefaultsFactory(
      pathToSource,
      entryFileRoot,
      entryFile,
      extras.debug ?? false,
      tsConfigPath,
      plugins,
    );

    const wp = loadWebpack();

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
              : configOrFactory(defaultOptions, wp);
          return {
            ...defaultOptions,
            mode: extras.watchMode ? 'development' : defaultOptions.mode,
            ...unwrappedConfig,
          };
        },
      );
      compiler = wp(webpackConfigurations);
      watchOptions = webpackConfigurations.map(
        (config) => config.watchOptions || {},
      );
      watch = webpackConfigurations.some((config) => config.watch);
    } else {
      const projectWebpackOptions =
        typeof extras.webpackConfigFactoryOrConfig !== 'function'
          ? extras.webpackConfigFactoryOrConfig
          : extras.webpackConfigFactoryOrConfig(defaultOptions, wp);
      const webpackConfiguration = {
        ...defaultOptions,
        mode: extras.watchMode ? 'development' : defaultOptions.mode,
        ...projectWebpackOptions,
      };
      compiler = wp(webpackConfiguration);
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
