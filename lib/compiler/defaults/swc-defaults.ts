import * as ts from 'typescript';
import { Configuration } from '../../configuration';

export const swcDefaultsFactory = (
  tsOptions?: ts.CompilerOptions,
  configuration?: Configuration,
) => {
  const builderOptions =
    typeof configuration?.compilerOptions?.builder !== 'string'
      ? configuration?.compilerOptions?.builder?.options
      : {};

  return {
    swcOptions: {
      sourceMaps:
        tsOptions?.sourceMap || (tsOptions?.inlineSourceMap && 'inline'),
      module: {
        type: 'commonjs',
      },
      jsc: {
        target: 'es2021',
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          useDefineForClassFields: false,
        },
        keepClassNames: true,
        baseUrl: tsOptions?.baseUrl,
        paths: tsOptions?.paths,
      },
      minify: false,
      swcrc: true,
    },
    cliOptions: {
      outDir: tsOptions?.outDir ? convertPath(tsOptions.outDir) : 'dist',
      filenames: [configuration?.sourceRoot ?? 'src'],
      sync: false,
      extensions: ['.js', '.ts'],
      copyFiles: false,
      includeDotfiles: false,
      quiet: false,
      watch: false,
      stripLeadingPaths: true,
      ...builderOptions,
    },
  };
};

/**
 * Converts Windows specific file paths to posix
 * @param windowsPath
 */
function convertPath(windowsPath: string) {
  return windowsPath
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')
    .replace(/\/\/+/g, '/');
}
