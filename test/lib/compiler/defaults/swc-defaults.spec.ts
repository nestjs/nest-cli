import * as ts from 'typescript';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveSwcModuleType,
  swcDefaultsFactory,
} from '../../../../lib/compiler/defaults/swc-defaults.js';
import * as esmProjectUtil from '../../../../lib/utils/is-esm-project.js';

vi.mock('../../../../lib/utils/is-esm-project.js');

describe('swcDefaultsFactory', () => {
  beforeEach(() => {
    vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(false);
  });

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

  it('should set stripLeadingPaths to true when rootDir is the source root', () => {
    // tsc flattens the source dir out of the output in this case, so swc
    // must do the same to produce an identical layout.
    const result = swcDefaultsFactory({ rootDir: './src' }, undefined);
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  it('should set stripLeadingPaths to true when a resolved rootDir ends with the source root', () => {
    const result = swcDefaultsFactory({ rootDir: '/repo/apps/main-app/src' }, {
      sourceRoot: 'apps/main-app/src',
    } as any);
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  it('should set stripLeadingPaths to false when rootDir is above the source root', () => {
    const result = swcDefaultsFactory({ rootDir: '/repo/apps' }, {
      sourceRoot: 'apps/main-app/src',
    } as any);
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
    const result = swcDefaultsFactory({ rootDir: '.' }, configuration as any);
    expect(result.cliOptions.stripLeadingPaths).toBe(true);
  });

  describe('jsc.baseUrl', () => {
    const paths = { '@shared/*': ['./src/shared/*'] };

    it('should pass baseUrl through when it is set', () => {
      const result = swcDefaultsFactory(
        { baseUrl: '/repo', paths, pathsBasePath: '/repo/config' },
        undefined,
      );
      expect(result.swcOptions.jsc.baseUrl).toBe('/repo');
      expect(result.swcOptions.jsc.paths).toBe(paths);
    });

    it('should fall back to the tsconfig directory when paths is set without baseUrl', () => {
      // TypeScript 6 deprecates "baseUrl"; tsc then resolves "paths"
      // relative to the tsconfig directory ("pathsBasePath"), and swc
      // panics unless it gets an absolute jsc.baseUrl.
      const result = swcDefaultsFactory(
        { paths, pathsBasePath: '/repo' },
        undefined,
      );
      expect(result.swcOptions.jsc.baseUrl).toBe('/repo');
      expect(result.swcOptions.jsc.paths).toBe(paths);
    });

    it('should leave baseUrl undefined when neither baseUrl nor paths is set', () => {
      const result = swcDefaultsFactory({ pathsBasePath: '/repo' }, undefined);
      expect(result.swcOptions.jsc.baseUrl).toBeUndefined();
    });

    it('should leave baseUrl undefined when tsOptions is undefined', () => {
      const result = swcDefaultsFactory(undefined, undefined);
      expect(result.swcOptions.jsc.baseUrl).toBeUndefined();
    });
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

  describe('module format', () => {
    it('should emit CommonJS when the package is not "type": "module"', () => {
      const result = swcDefaultsFactory({
        module: ts.ModuleKind.NodeNext,
      });
      expect(result.swcOptions.module).toEqual({ type: 'commonjs' });
      expect(result.swcOptions.jsc).not.toHaveProperty('experimental');
    });

    it('should emit ES modules with full specifiers when the package is "type": "module"', () => {
      vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(true);

      const result = swcDefaultsFactory({
        module: ts.ModuleKind.NodeNext,
      });
      expect(result.swcOptions.module).toEqual({
        type: 'es6',
        resolveFully: true,
      });
      expect(result.swcOptions.jsc.experimental).toEqual({
        keepImportAttributes: true,
      });
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

describe('resolveSwcModuleType', () => {
  it('should return commonjs for packages that are not "type": "module"', () => {
    expect(resolveSwcModuleType(undefined, false)).toBe('commonjs');
    expect(
      resolveSwcModuleType({ module: ts.ModuleKind.CommonJS }, false),
    ).toBe('commonjs');
    expect(
      resolveSwcModuleType({ module: ts.ModuleKind.NodeNext }, false),
    ).toBe('commonjs');
    expect(resolveSwcModuleType({ module: ts.ModuleKind.ESNext }, false)).toBe(
      'commonjs',
    );
  });

  it.each([
    ['unset', undefined],
    ['ES2015', ts.ModuleKind.ES2015],
    ['ES2022', ts.ModuleKind.ES2022],
    ['ESNext', ts.ModuleKind.ESNext],
    ['Node16', ts.ModuleKind.Node16],
    ['NodeNext', ts.ModuleKind.NodeNext],
    ['Preserve', ts.ModuleKind.Preserve],
  ])(
    'should return es6 for "type": "module" packages when module is %s',
    (_, module) => {
      expect(resolveSwcModuleType({ module }, true)).toBe('es6');
    },
  );

  it('should return commonjs for "type": "module" packages that pin "module": "commonjs"', () => {
    expect(resolveSwcModuleType({ module: ts.ModuleKind.CommonJS }, true)).toBe(
      'commonjs',
    );
  });

  it('should detect the package type of the current project by default', () => {
    vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(true);
    expect(resolveSwcModuleType({})).toBe('es6');

    vi.mocked(esmProjectUtil.isEsmProject).mockReturnValue(false);
    expect(resolveSwcModuleType({})).toBe('commonjs');
  });
});
