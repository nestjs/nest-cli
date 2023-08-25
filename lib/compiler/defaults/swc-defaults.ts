import { platform } from 'process';
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

  // swc does not currently support paths mapping on Windows
  // see https://github.com/nestjs/nest-cli/issues/2211
  const pathsMappingOptions = platform?.startsWith('win')
    ? {}
    : {
        baseUrl: tsOptions?.baseUrl,
        paths: tsOptions?.paths,
      };

  return {
    swcOptions: {
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
        ...pathsMappingOptions,
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
