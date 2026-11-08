import { builtinModules, createRequire } from 'module';
import { join } from 'path';
import type * as ts from 'typescript';
import type nodeExternals from 'webpack-node-externals';
import type { CompilerOptions } from '../../configuration/index.js';
import { defaultTsconfigFilename } from '../../configuration/defaults.js';
import {
  BundleDependenciesPlugin,
  createBundleExternals,
  findExternalPackages,
  isMissingOptionalPackage,
} from './bundle-dependencies.js';
import { appendTsExtension } from '../helpers/append-extension.js';
import { MultiNestCompilerPlugins } from '../plugins/plugins-loader.js';
import { isMissingLazyImport } from './lazy-imports.js';

const require = createRequire(import.meta.url);

function loadRspackDeps() {
  try {
    const rspack = require('@rspack/core');
    const externals = require('webpack-node-externals') as typeof nodeExternals;

    return { nodeExternals: externals, rspack };
  } catch (e: any) {
    if (e?.code !== 'MODULE_NOT_FOUND' && e?.code !== 'ERR_MODULE_NOT_FOUND') {
      // Only the "package missing" branch is wrapped with install advice.
      // Surfacing unrelated errors as "package not found" would mislead
      // users into reinstalling perfectly valid dependencies.
      throw e;
    }
    // Use a non-greedy match so error messages that contain multiple
    // quoted paths (e.g. ESM "Cannot find package 'foo' imported from
    // '/abs/path.mjs'") still extract the package name rather than the
    // importing file path.
    const pkg =
      e?.message?.match?.(/Cannot find.*?'([^']+)'/)?.[1] ??
      'webpack-node-externals';
    throw new Error(
      `The "${pkg}" package is required when using the rspack compiler but could not be found. ` +
        `Please install it:\n\n  npm install --save-dev @rspack/core webpack-node-externals\n`,
      { cause: e },
    );
  }
}

export const rspackDefaultsFactory = (
  sourceRoot: string,
  relativeSourceRoot: string,
  entryFilename: string,
  isDebugEnabled = false,
  tsConfigFile = defaultTsconfigFilename,
  // builtin:swc-loader cannot run the TypeScript transformers of CLI plugins
  _plugins: MultiNestCompilerPlugins,
  isEsm = false,
  tsOptions?: ts.CompilerOptions,
  bundleDependenciesOption: CompilerOptions['bundleDependencies'] = false,
): Record<string, any> => {
  const { nodeExternals: externals } = loadRspackDeps();

  const sourceMaps =
    tsOptions?.sourceMap || (tsOptions?.inlineSourceMap && 'inline');
  const devtool =
    sourceMaps === 'inline'
      ? 'inline-source-map'
      : sourceMaps
        ? 'source-map'
        : false;

  const bundleDependencies = !!bundleDependenciesOption;
  const externalPackages = bundleDependencies
    ? findExternalPackages(
        process.cwd(),
        typeof bundleDependenciesOption === 'object'
          ? bundleDependenciesOption.exclude
          : undefined,
      )
    : [];
  const ignoredOptionalPackages = new Set<string>();

  const rspackConfiguration: Record<string, any> = {
    entry: appendTsExtension(join(sourceRoot, entryFilename)),
    devtool,
    target: 'node',
    output: {
      filename: join(relativeSourceRoot, `${entryFilename}.js`).replace(
        /\\/g,
        '/',
      ),
      ...(isEsm && {
        module: true,
        library: { type: 'module' },
        chunkFormat: 'module',
        chunkLoading: 'import',
      }),
      ...(!isEsm && { library: { type: 'commonjs2' } }),
    },
    ...(isEsm && {
      experiments: { outputModule: true, topLevelAwait: true },
    }),
    ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
    externals: bundleDependencies
      ? [createBundleExternals(isEsm, externalPackages)]
      : [
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
    externalsPresets: { node: !isEsm && !bundleDependencies },
    module: {
      // ESM dependencies load CommonJS peers through `createRequire(import.meta.url)`;
      // left unparsed, those requires resolve from the build machine at runtime
      ...(bundleDependencies && {
        parser: { javascript: { createRequire: true } },
      }),
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
                sourceMaps,
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
        checkResource(resource: string) {
          if (
            !isMissingLazyImport(resource) &&
            !(bundleDependencies && isMissingOptionalPackage(resource))
          ) {
            return false;
          }
          ignoredOptionalPackages.add(resource);
          return true;
        },
      }),
    );
  } catch {
    // @rspack/core not available, skip IgnorePlugin
  }

  if (bundleDependencies) {
    rspackConfiguration.plugins!.push(
      new BundleDependenciesPlugin({
        isEsm,
        externalPackages,
        ignored: ignoredOptionalPackages,
      }),
    );
  }

  // builtin:swc-loader only strips types, so the checker runs even when CLI
  // plugins are registered (unlike webpack, where ts-loader then checks them)
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

  return rspackConfiguration;
};
