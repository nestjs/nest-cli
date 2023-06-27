import * as ts from 'typescript';
import { SwcCliOptions } from '../../configuration';

export const swcDefaultsFactory = (
  tsOptions: ts.CompilerOptions,
  swcCliOptions?: SwcCliOptions,
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
      outDir: swcCliOptions?.outDir || tsOptions.outDir || 'dist',
      filenames: swcCliOptions?.filenames || ['src'],
      sync: swcCliOptions?.sync || false,
      extensions: swcCliOptions?.extensions || ['.js', '.ts'],
      watch: false,
      copyFiles: swcCliOptions?.copyFiles || false,
      includeDotfiles: swcCliOptions?.includeDotfiles || false,
      quiet: swcCliOptions?.quiet || false,
    },
  };
};
