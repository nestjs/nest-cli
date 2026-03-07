import { builtinModules, createRequire } from 'module';
import { join } from 'path';
import type { TsconfigPathsPlugin as TsconfigPathsPluginType } from 'tsconfig-paths-webpack-plugin';
import type nodeExternals from 'webpack-node-externals';
import { defaultTsconfigFilename } from '../../configuration/defaults.js';
import { appendTsExtension } from '../helpers/append-extension.js';
import { MultiNestCompilerPlugins } from '../plugins/plugins-loader.js';

const require = createRequire(import.meta.url);

function loadRspackDeps() {
  try {
    const rspack = require('@rspack/core');
    const externals = require('webpack-node-externals') as typeof nodeExternals;
    const { TsconfigPathsPlugin } =
      require('tsconfig-paths-webpack-plugin') as {
        TsconfigPathsPlugin: typeof TsconfigPathsPluginType;
      };
    return { nodeExternals: externals, TsconfigPathsPlugin, rspack };
  } catch (e: any) {
    const pkg =
      e?.message?.match?.(/Cannot find.*'([^']+)'/)?.[1] ??
      'webpack-node-externals';
    throw new Error(
      `The "${pkg}" package is required when using the rspack compiler but could not be found. ` +
        `Please install it:\n\n  npm install --save-dev @rspack/core webpack-node-externals tsconfig-paths-webpack-plugin\n`,
    );
  }
}

export const rspackDefaultsFactory = (
  sourceRoot: string,
  relativeSourceRoot: string,
  entryFilename: string,
  isDebugEnabled = false,
  tsConfigFile = defaultTsconfigFilename,
  plugins: MultiNestCompilerPlugins,
  isEsm = false,
): Record<string, any> => {
  const { nodeExternals: externals, TsconfigPathsPlugin } = loadRspackDeps();

  const isPluginRegistered = isAnyPluginRegistered(plugins);

  const rspackConfiguration: Record<string, any> = {
    entry: appendTsExtension(join(sourceRoot, entryFilename)),
    devtool: isDebugEnabled ? 'inline-source-map' : false,
    target: 'node',
    output: {
      filename: join(relativeSourceRoot, `${entryFilename}.js`),
      ...(isEsm && {
        module: true,
        library: { type: 'module' },
        chunkFormat: 'module',
        chunkLoading: 'import',
      }),
    },
    ...(isEsm && {
      experiments: { outputModule: true, topLevelAwait: true },
    }),
    ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
    externals: [
      externals(isEsm ? { importType: 'module' } : {}) as any,
      ...(isEsm
        ? [
            ({ request }: { request?: string }, callback: Function) => {
              if (!request) return callback();
              const bare = request.startsWith('node:')
                ? request.slice(5)
                : request;
              if (builtinModules.includes(bare)) {
                return callback(null, `module ${request}`);
              }
              callback();
            },
          ]
        : []),
    ],
    externalsPresets: { node: !isEsm },
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
          ...(isEsm && { type: 'javascript/esm' as const }),
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      ...(isEsm && {
        extensionAlias: {
          '.js': ['.ts', '.js'],
          '.mjs': ['.mts', '.mjs'],
        },
      }),
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
