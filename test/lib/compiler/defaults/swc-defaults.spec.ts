import { describe, expect, it } from 'vitest';
import { swcDefaultsFactory } from '../../../../lib/compiler/defaults/swc-defaults.js';

describe('swcDefaultsFactory', () => {
  it('should set stripLeadingPaths to true when rootDir is not set', () => {
    const result = swcDefaultsFactory({}, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  it('should set stripLeadingPaths to true when tsOptions is undefined', () => {
    const result = swcDefaultsFactory(undefined, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  it('should set stripLeadingPaths to false when rootDir is set', () => {
    const result = swcDefaultsFactory({ rootDir: '.' }, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(false);
  });

  it('should set stripLeadingPaths to false when rootDir is set to a path', () => {
    const result = swcDefaultsFactory({ rootDir: './src' }, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(false);
  });

  it('should allow user to override stripLeadingPaths via builder options', () => {
    const configuration = {
      compilerOptions: {
        builder: {
          type: 'swc' as const,
          options: {
            stripLeadingPaths: true,
          },
        },
      },
    };
    const result = swcDefaultsFactory(
      { rootDir: '.' },
      configuration as any,
    );
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  it('should use outDir from tsOptions when provided', () => {
    const result = swcDefaultsFactory({ outDir: 'build' }, undefined);
    expect(result.cliOptions.outDir).toBe('build');
  });

  it('should default outDir to dist when not provided', () => {
    const result = swcDefaultsFactory({}, undefined);
    expect(result.cliOptions.outDir).toBe('dist');
  });

  it('should use sourceRoot from configuration for filenames', () => {
    const configuration = {
      sourceRoot: 'lib',
    };
    const result = swcDefaultsFactory({}, configuration as any);
    expect(result.cliOptions.filenames).toEqual(['lib']);
  });

  it('should default filenames to src when sourceRoot is not set', () => {
    const result = swcDefaultsFactory({}, undefined);
    expect(result.cliOptions.filenames).toEqual(['src']);
  });

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
      const result = swcDefaultsFactory({ sourceMap: true });
      expect(result.swcOptions.sourceMaps).toBe(true);
    });

    it('should set sourceMaps to "inline" if inlineSourceMap is true in tsOptions', () => {
      const result = swcDefaultsFactory({ inlineSourceMap: true });
      expect(result.swcOptions.sourceMaps).toBe('inline');
    });

    it('should set baseUrl and paths from tsOptions', () => {
      const tsOptions = {
        baseUrl: './',
        paths: {
          '@app/*': ['src/*'],
        },
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
      const tsOptions = { outDir: 'build\\dist' };
      const result = swcDefaultsFactory(tsOptions);
      expect(result.cliOptions.outDir).toBe('build/dist');
    });

    it('should handle Windows specific path prefixes in outDir', () => {
      const tsOptions = { outDir: '\\\\?\\C:\\dist' };
      const result = swcDefaultsFactory(tsOptions);
      expect(result.cliOptions.outDir).toBe('C:/dist');
    });

    it('should set ignore if tsconfig exclude is provided', () => {
      const result = swcDefaultsFactory({}, undefined, ['test/**/*.ts']);
      expect(result.cliOptions.ignore).toEqual(['test/**/*.ts']);
    });

    it('allows builder options ignore to override tsconfig exclude', () => {
      const configuration = {
        compilerOptions: {
          builder: {
            type: 'swc' as const,
            options: {
              ignore: ['custom/**/*.ts'],
            },
          },
        },
      };

      const result = swcDefaultsFactory({}, configuration as any, [
        'tsconfig-excluded/**/*.ts',
      ]);

      expect(result.cliOptions.ignore).toEqual(['custom/**/*.ts']);
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
