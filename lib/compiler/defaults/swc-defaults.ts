import * as ts from 'typescript';
import { Configuration } from '../../configuration';

export const swcDefaultsFactory = (
  configuration: Configuration,
  tsOptions: ts.CompilerOptions,
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
      outDir: tsOptions.outDir ?? 'dist',
      filenames: [configuration.sourceRoot ?? 'src'],
      sync: false,
      extensions: ['.js', '.ts'],
      watch: false,
      copyFiles: false,
      includeDotfiles: false,
      quiet: false,
    },
  };
};
