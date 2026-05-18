import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { requireFns } = vi.hoisted(() => {
  return {
    requireFns: {
      '@rspack/core': vi.fn(),
      'webpack-node-externals': vi.fn(),
      'tsconfig-paths-webpack-plugin': vi.fn(),
      'fork-ts-checker-webpack-plugin': vi.fn(),
    } as Record<string, ReturnType<typeof vi.fn>>,
  };
});

vi.mock('module', async (importOriginal) => {
  const actual = await importOriginal<typeof import('module')>();
  return {
    ...actual,
    createRequire: (url: string | URL) => {
      const realReq = actual.createRequire(url);
      const mockedReq: any = (id: string) => {
        if (Object.prototype.hasOwnProperty.call(requireFns, id)) {
          return requireFns[id](id);
        }
        return realReq(id);
      };
      mockedReq.resolve = realReq.resolve.bind(realReq);
      mockedReq.resolve.paths = realReq.resolve.paths?.bind(realReq.resolve);
      return mockedReq;
    },
  };
});

import { rspackDefaultsFactory } from '../../../../lib/compiler/defaults/rspack-defaults.js';
import { MultiNestCompilerPlugins } from '../../../../lib/compiler/plugins/plugins-loader.js';

const emptyPlugins: MultiNestCompilerPlugins = {
  beforeHooks: [],
  afterHooks: [],
  afterDeclarationsHooks: [],
};

// vi.fn() can be used with `new`; arrow functions cannot. The factory
// invokes `new IgnorePlugin(...)` and `new TsconfigPathsPlugin(...)`,
// so the mocks must be plain `vi.fn()` (which acts as a constructor).
const makeMockRspack = () => ({
  IgnorePlugin: vi.fn(),
});

const makeMockExternals = () => vi.fn(() => () => undefined);

const makeMockTsconfigPathsPlugin = () => ({
  TsconfigPathsPlugin: vi.fn(),
});

const moduleNotFoundError = (pkg: string, message?: string) => {
  const err = new Error(message ?? `Cannot find module '${pkg}'`) as Error & {
    code: string;
  };
  err.code = 'MODULE_NOT_FOUND';
  return err;
};

describe('rspackDefaultsFactory', () => {
  beforeEach(() => {
    requireFns['@rspack/core'].mockReset();
    requireFns['webpack-node-externals'].mockReset();
    requireFns['tsconfig-paths-webpack-plugin'].mockReset();
    requireFns['fork-ts-checker-webpack-plugin'].mockReset();

    requireFns['@rspack/core'].mockReturnValue(makeMockRspack());
    requireFns['webpack-node-externals'].mockReturnValue(makeMockExternals());
    requireFns['tsconfig-paths-webpack-plugin'].mockReturnValue(
      makeMockTsconfigPathsPlugin(),
    );
    requireFns['fork-ts-checker-webpack-plugin'].mockReturnValue(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('happy path', () => {
    it('should produce a configuration object with expected entry filename', () => {
      const config = rspackDefaultsFactory(
        '/abs/src',
        'src',
        'main',
        false,
        'tsconfig.build.json',
        emptyPlugins,
      );

      expect(config.entry).toContain('main.ts');
      expect(config.target).toBe('node');
      expect(config.mode).toBe('none');
    });

    it('should normalize output filename to forward slashes', () => {
      const config = rspackDefaultsFactory(
        '/abs/src',
        'apps\\my-app\\src',
        'main',
        false,
        'tsconfig.build.json',
        emptyPlugins,
      );

      expect(config.output.filename).not.toMatch(/\\/);
      expect(config.output.filename).toContain('/');
    });

    it('should configure ESM output when isEsm is true', () => {
      const config = rspackDefaultsFactory(
        '/abs/src',
        'src',
        'main',
        false,
        'tsconfig.json',
        emptyPlugins,
        true,
      );

      expect(config.experiments?.outputModule).toBe(true);
      expect(config.output.module).toBe(true);
      expect(config.externalsPresets).toEqual({ node: false });
    });

    it('should configure CJS output when isEsm is false', () => {
      const config = rspackDefaultsFactory(
        '/abs/src',
        'src',
        'main',
        false,
        'tsconfig.json',
        emptyPlugins,
        false,
      );

      expect(config.experiments).toBeUndefined();
      expect(config.output.module).toBeUndefined();
      expect(config.externalsPresets).toEqual({ node: true });
    });
  });

  describe('error handling for missing peer dependencies', () => {
    it('should report the missing package name when @rspack/core is not installed', () => {
      requireFns['@rspack/core'].mockImplementation(() => {
        throw moduleNotFoundError('@rspack/core');
      });

      expect(() =>
        rspackDefaultsFactory(
          '/abs/src',
          'src',
          'main',
          false,
          'tsconfig.json',
          emptyPlugins,
        ),
      ).toThrow(/"@rspack\/core" package is required/);
    });

    it('should report the missing package name when webpack-node-externals is not installed', () => {
      requireFns['webpack-node-externals'].mockImplementation(() => {
        throw moduleNotFoundError('webpack-node-externals');
      });

      expect(() =>
        rspackDefaultsFactory(
          '/abs/src',
          'src',
          'main',
          false,
          'tsconfig.json',
          emptyPlugins,
        ),
      ).toThrow(/"webpack-node-externals" package is required/);
    });

    it('should report the missing package name from an ESM-style "Cannot find package" error', () => {
      const err = new Error(
        "Cannot find package '@rspack/core' imported from '/abs/path/to/file.mjs'",
      ) as Error & { code: string };
      err.code = 'ERR_MODULE_NOT_FOUND';
      requireFns['@rspack/core'].mockImplementation(() => {
        throw err;
      });

      expect(() =>
        rspackDefaultsFactory(
          '/abs/src',
          'src',
          'main',
          false,
          'tsconfig.json',
          emptyPlugins,
        ),
      ).toThrow(/"@rspack\/core" package is required/);
    });

    it('should re-throw unrelated errors without wrapping them', () => {
      const original = new TypeError('rspack internal type error');
      requireFns['@rspack/core'].mockImplementation(() => {
        throw original;
      });

      expect(() =>
        rspackDefaultsFactory(
          '/abs/src',
          'src',
          'main',
          false,
          'tsconfig.json',
          emptyPlugins,
        ),
      ).toThrow(original);
    });

    it('should attach the original module-not-found error as cause', () => {
      const original = moduleNotFoundError('@rspack/core');
      requireFns['@rspack/core'].mockImplementation(() => {
        throw original;
      });

      try {
        rspackDefaultsFactory(
          '/abs/src',
          'src',
          'main',
          false,
          'tsconfig.json',
          emptyPlugins,
        );
        throw new Error('expected rspackDefaultsFactory to throw');
      } catch (e) {
        expect((e as Error).cause).toBe(original);
      }
    });
  });
});
