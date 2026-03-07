import { createRequire } from 'module';
import { join } from 'path';
import type { TsconfigPathsPlugin as TsconfigPathsPluginType } from 'tsconfig-paths-webpack-plugin';
import type webpack from 'webpack';
import type nodeExternals from 'webpack-node-externals';
import { defaultTsconfigFilename } from '../../configuration/defaults.js';
import { appendTsExtension } from '../helpers/append-extension.js';
import { MultiNestCompilerPlugins } from '../plugins/plugins-loader.js';

const require = createRequire(import.meta.url);

function loadWebpackDeps() {
  try {
    const wp = require('webpack') as typeof webpack;
    const externals = require('webpack-node-externals') as typeof nodeExternals;
    const { TsconfigPathsPlugin } =
      require('tsconfig-paths-webpack-plugin') as {
        TsconfigPathsPlugin: typeof TsconfigPathsPluginType;
      };
    return { webpack: wp, nodeExternals: externals, TsconfigPathsPlugin };
  } catch (e: any) {
    const pkg = e?.message?.match?.(/Cannot find.*'([^']+)'/)?.[1] ?? 'webpack';
    throw new Error(
      `The "${pkg}" package is required when using the webpack compiler but could not be found. ` +
        `Please install it:\n\n  npm install --save-dev webpack webpack-node-externals tsconfig-paths-webpack-plugin ts-loader fork-ts-checker-webpack-plugin\n`,
    );
  }
}

export const webpackDefaultsFactory = (
  sourceRoot: string,
  relativeSourceRoot: string,
  entryFilename: string,
  isDebugEnabled = false,
  tsConfigFile = defaultTsconfigFilename,
  plugins: MultiNestCompilerPlugins,
): webpack.Configuration => {
  const {
    webpack: wp,
    nodeExternals: externals,
    TsconfigPathsPlugin,
  } = loadWebpackDeps();

  const isPluginRegistered = isAnyPluginRegistered(plugins);
  const webpackConfiguration: webpack.Configuration = {
    entry: appendTsExtension(join(sourceRoot, entryFilename)),
    devtool: isDebugEnabled ? 'inline-source-map' : false,
    target: 'node',
    output: {
      filename: join(relativeSourceRoot, `${entryFilename}.js`),
    },
    ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
    externals: [externals() as any],
    externalsPresets: { node: true },
    module: {
      rules: [
        {
          test: /.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: !isPluginRegistered,
                configFile: tsConfigFile,
                getCustomTransformers: (program: any) => ({
                  before: plugins.beforeHooks.map((hook: any) => hook(program)),
                  after: plugins.afterHooks.map((hook: any) => hook(program)),
                  afterDeclarations: plugins.afterDeclarationsHooks.map(
                    (hook: any) => hook(program),
                  ),
                }),
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: tsConfigFile,
        }),
      ],
    },
    mode: 'none',
    optimization: {
      nodeEnv: false,
    },
    node: {
      __filename: false,
      __dirname: false,
    },
    plugins: [
      new wp.IgnorePlugin({
        checkResource(resource: any) {
          const lazyImports = [
            '@nestjs/microservices',
            '@nestjs/microservices/microservices-module',
            '@nestjs/websockets/socket-module',
            'class-validator',
            'class-transformer',
            'class-transformer/storage',
          ];
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource, {
              paths: [process.cwd()],
            });
          } catch {
            return true;
          }
          return false;
        },
      }),
    ],
  };

  if (!isPluginRegistered) {
    const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

    webpackConfiguration.plugins!.push(
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: tsConfigFile,
        },
      }),
    );
  }

  return webpackConfiguration;
};

function isAnyPluginRegistered(plugins: MultiNestCompilerPlugins) {
  return (
    (plugins.afterHooks && plugins.afterHooks.length > 0) ||
    (plugins.beforeHooks && plugins.beforeHooks.length > 0) ||
    (plugins.afterDeclarationsHooks &&
      plugins.afterDeclarationsHooks.length > 0)
  );
}
