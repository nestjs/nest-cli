export const swcDefaultsFactory = () => {
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
        baseUrl: './',
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
