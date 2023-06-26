import * as ts from 'typescript';

export const swcDefaultsFactory = (tsOptions: ts.CompilerOptions) => {
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
      outDir: 'dist',
      filenames: ['src'],
      sync: false,
      extensions: ['.js', '.ts'],
      watch: false,
      copyFiles: false,
      includeDotfiles: false,
      quiet: false,
    },
  };
};
