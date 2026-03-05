import { createRequire } from 'module';
import { join } from 'path';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { defaultTsconfigFilename } from '../../configuration/defaults.js';
import { appendTsExtension } from '../helpers/append-extension.js';
import { MultiNestCompilerPlugins } from '../plugins/plugins-loader.js';
import nodeExternals from 'webpack-node-externals';

const require = createRequire(import.meta.url);

export const rspackDefaultsFactory = (
  sourceRoot: string,
  relativeSourceRoot: string,
  entryFilename: string,
  isDebugEnabled = false,
  tsConfigFile = defaultTsconfigFilename,
  plugins: MultiNestCompilerPlugins,
): Record<string, any> => {
  const isPluginRegistered = isAnyPluginRegistered(plugins);

  const rspackConfiguration: Record<string, any> = {
    entry: appendTsExtension(join(sourceRoot, entryFilename)),
    devtool: isDebugEnabled ? 'inline-source-map' : false,
    target: 'node',
    output: {
      filename: join(relativeSourceRoot, `${entryFilename}.js`),
    },
    ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
    externals: [nodeExternals() as any],
    externalsPresets: { node: true },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    decorators: true,
                  },
                  transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true,
                  },
                  target: 'es2021',
                },
                sourceMaps: isDebugEnabled,
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      tsConfig: tsConfigFile,
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
    plugins: [],
  };

  // rspack has built-in IgnorePlugin (compatible with webpack's)
  try {
    const rspack = require('@rspack/core');
    rspackConfiguration.plugins!.push(
      new rspack.IgnorePlugin({
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
    );
  } catch {
    // @rspack/core not available, skip IgnorePlugin
  }

  if (!isPluginRegistered) {
    try {
      const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
      rspackConfiguration.plugins!.push(
        new ForkTsCheckerWebpackPlugin({
          typescript: {
            configFile: tsConfigFile,
          },
        }),
      );
    } catch {
      // fork-ts-checker-webpack-plugin not available, skip
    }
  }

  return rspackConfiguration;
};

function isAnyPluginRegistered(plugins: MultiNestCompilerPlugins) {
  return (
    (plugins.afterHooks && plugins.afterHooks.length > 0) ||
    (plugins.beforeHooks && plugins.beforeHooks.length > 0) ||
    (plugins.afterDeclarationsHooks &&
      plugins.afterDeclarationsHooks.length > 0)
  );
}
