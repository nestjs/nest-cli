import * as ts from 'typescript';
import { Configuration } from '../../configuration';

type SwcCliOptions = Required<
  Required<Configuration>['compilerOptions']
>['swcCliOptions'];

export const swcDefaultsFactory = (
  tsOptions: ts.CompilerOptions,
  swcCliOptions: SwcCliOptions,
) => {
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
        },
        keepClassNames: true,
        baseUrl: tsOptions.baseUrl,
        paths: tsOptions.paths,
      },
      minify: false,
      swcrc: true,
    },
    cliOptions: {
      outDir: tsOptions.outDir || 'dist',
      filenames: ['src'],
      sync: false,
      extensions: ['.js', '.ts'],
      copyFiles: false,
      includeDotfiles: false,
      quiet: false,
      watch: false,

      // Merge swcCliOptions
      ...swcCliOptions,
    },
  };
};
