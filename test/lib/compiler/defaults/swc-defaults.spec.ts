import { swcDefaultsFactory } from '../../../../lib/compiler/defaults/swc-defaults';

describe('swcDefaultsFactory', () => {
  it('should return default configuration when no options are provided', () => {
    const result = swcDefaultsFactory();

    expect(result.swcOptions).toEqual({
      sourceMaps: undefined,
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
        baseUrl: undefined,
        paths: undefined,
      },
      minify: false,
      swcrc: true,
    });

    expect(result.cliOptions).toEqual({
      outDir: 'dist',
      filenames: ['src'],
      sync: false,
      extensions: ['.js', '.ts'],
      copyFiles: false,
      includeDotfiles: false,
      ignore: undefined,
      quiet: false,
      watch: false,
      stripLeadingPaths: true,
    });
  });

  describe('swcOptions', () => {
    it('should set sourceMaps to true if sourceMap is true in tsOptions', () => {
      const result = swcDefaultsFactory({ sourceMap: true, exclude: [] });
      expect(result.swcOptions.sourceMaps).toBe(true);
    });

    it('should set sourceMaps to "inline" if inlineSourceMap is true in tsOptions', () => {
      const result = swcDefaultsFactory({ inlineSourceMap: true, exclude: [] });
      expect(result.swcOptions.sourceMaps).toBe('inline');
    });

    it('should set baseUrl and paths from tsOptions', () => {
      const tsOptions = {
        baseUrl: './',
        paths: {
          '@app/*': ['src/*'],
        },
        exclude: [],
      };
      const result = swcDefaultsFactory(tsOptions);
      expect(result.swcOptions.jsc.baseUrl).toBe('./');
      expect(result.swcOptions.jsc.paths).toEqual({
        '@app/*': ['src/*'],
      });
    });
  });

  describe('cliOptions', () => {
    it('should use sourceRoot from configuration for filenames', () => {
      const configuration = { sourceRoot: 'custom-src' };
      const result = swcDefaultsFactory(undefined, configuration);
      expect(result.cliOptions.filenames).toEqual(['custom-src']);
    });

    it('should use outDir from tsOptions and convert path', () => {
      const tsOptions = { outDir: 'build\\dist', exclude: [] };
      const result = swcDefaultsFactory(tsOptions);
      expect(result.cliOptions.outDir).toBe('build/dist');
    });

    it('should handle Windows specific path prefixes in outDir', () => {
      const tsOptions = { outDir: '\\\\?\\C:\\dist', exclude: [] };
      const result = swcDefaultsFactory(tsOptions);
      expect(result.cliOptions.outDir).toBe('C:/dist');
    });

    it('should set ignore if exclude is provided in tsOptions', () => {
      const tsOptions = { exclude: ['test/**/*.ts'] };
      const result = swcDefaultsFactory(tsOptions);
      expect(result.cliOptions.ignore).toEqual(['test/**/*.ts']);
    });

    it('should merge builder options from configuration', () => {
      const configuration = {
        compilerOptions: {
          builder: {
            type: 'swc' as const,
            options: {
              watch: true,
              sync: true,
              copyFiles: true,
            },
          },
        },
      };
      const result = swcDefaultsFactory(undefined, configuration);
      expect(result.cliOptions.watch).toBe(true);
      expect(result.cliOptions.sync).toBe(true);
      expect(result.cliOptions.copyFiles).toBe(true);
    });

    it('should not merge builder options if builder is a string', () => {
      const configuration = {
        compilerOptions: {
          builder: 'swc',
        },
      };

      const result = swcDefaultsFactory(undefined, configuration as any);
      expect(result.cliOptions.watch).toBe(false);
      expect(result.cliOptions.sync).toBe(false);
      expect(result.cliOptions.copyFiles).toBe(false);
    });
  });
});
