import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted module mocks. Each test resets the implementation of these
// functions to simulate either a successful require (mock module returned)
// or a failing require (error thrown) for the corresponding peer dep.
const { requireFns } = vi.hoisted(() => {
  return {
    requireFns: {
      webpack: vi.fn(),
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

// Import AFTER vi.mock so the factory uses the mocked createRequire.
import { webpackDefaultsFactory } from '../../../../lib/compiler/defaults/webpack-defaults.js';
import { MultiNestCompilerPlugins } from '../../../../lib/compiler/plugins/plugins-loader.js';

const emptyPlugins: MultiNestCompilerPlugins = {
  beforeHooks: [],
  afterHooks: [],
  afterDeclarationsHooks: [],
};

// vi.fn() can be used with `new`; arrow functions cannot. Webpack and
// rspack both call `new IgnorePlugin(...)` and `new TsconfigPathsPlugin(...)`,
// so the mocks must be plain `vi.fn()` (which acts as a constructor).
const makeMockWebpack = () =>
  Object.assign(vi.fn(), {
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

describe('webpackDefaultsFactory', () => {
  beforeEach(() => {
    requireFns.webpack.mockReset();
    requireFns['webpack-node-externals'].mockReset();
    requireFns['tsconfig-paths-webpack-plugin'].mockReset();
    requireFns['fork-ts-checker-webpack-plugin'].mockReset();

    requireFns.webpack.mockReturnValue(makeMockWebpack());
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
      const config = webpackDefaultsFactory(
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
      const config = webpackDefaultsFactory(
        '/abs/src',
        'apps\\my-app\\src',
        'main',
        false,
        'tsconfig.build.json',
        emptyPlugins,
      );

      // Even on Windows where path.join would use backslashes, the output
      // filename must use forward slashes so webpack treats it as a single
      // path segment instead of an escape-sequence-laden literal.
      expect((config.output as any).filename).not.toMatch(/\\/);
      expect((config.output as any).filename).toContain('/');
    });

    it('should register ForkTsCheckerWebpackPlugin when no compiler plugins are provided', () => {
      const config = webpackDefaultsFactory(
        '/abs/src',
        'src',
        'main',
        false,
        'tsconfig.json',
        emptyPlugins,
      );

      expect(requireFns['fork-ts-checker-webpack-plugin']).toHaveBeenCalled();
      expect(config.plugins).toBeDefined();
      // IgnorePlugin + ForkTsCheckerWebpackPlugin
      expect((config.plugins as any[]).length).toBe(2);
    });

    it('should not register ForkTsCheckerWebpackPlugin when compiler plugins are provided', () => {
      const config = webpackDefaultsFactory(
        '/abs/src',
        'src',
        'main',
        false,
        'tsconfig.json',
        {
          beforeHooks: [vi.fn()],
          afterHooks: [],
          afterDeclarationsHooks: [],
        },
      );

      expect(
        requireFns['fork-ts-checker-webpack-plugin'],
      ).not.toHaveBeenCalled();
      // IgnorePlugin only
      expect((config.plugins as any[]).length).toBe(1);
    });
  });

  describe('error handling for missing peer dependencies', () => {
    it('should report the missing package name when webpack itself is not installed', () => {
      requireFns.webpack.mockImplementation(() => {
        throw moduleNotFoundError('webpack');
      });

      expect(() =>
        webpackDefaultsFactory(
          '/abs/src',
          'src',
          'main',
          false,
          'tsconfig.json',
          emptyPlugins,
        ),
      ).toThrow(/"webpack" package is required/);
    });

    it('should report the missing package name when webpack-node-externals is not installed', () => {
      requireFns['webpack-node-externals'].mockImplementation(() => {
        throw moduleNotFoundError('webpack-node-externals');
      });

      expect(() =>
        webpackDefaultsFactory(
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
      // Node's ESM resolver formats missing-package errors with two quoted
      // segments: the missing package and the importing file. The earlier
      // greedy regex captured the importing file path, which the user is
      // told to install — clearly nonsense advice. Verify the new
      // non-greedy regex captures the package name instead.
      const err = new Error(
        "Cannot find package 'webpack-node-externals' imported from '/abs/path/to/file.mjs'",
      ) as Error & { code: string };
      err.code = 'ERR_MODULE_NOT_FOUND';
      requireFns['webpack-node-externals'].mockImplementation(() => {
        throw err;
      });

      expect(() =>
        webpackDefaultsFactory(
          '/abs/src',
          'src',
          'main',
          false,
          'tsconfig.json',
          emptyPlugins,
        ),
      ).toThrow(/"webpack-node-externals" package is required/);
    });

    it('should fall back to "webpack" when the error message does not match', () => {
      const err = new Error('some unparseable error') as Error & {
        code: string;
      };
      err.code = 'MODULE_NOT_FOUND';
      requireFns.webpack.mockImplementation(() => {
        throw err;
      });

      expect(() =>
        webpackDefaultsFactory(
          '/abs/src',
          'src',
          'main',
          false,
          'tsconfig.json',
          emptyPlugins,
        ),
      ).toThrow(/"webpack" package is required/);
    });

    it('should re-throw unrelated errors without wrapping them', () => {
      // If a peer dep is installed but its own initialization explodes
      // (e.g. version mismatch, syntax error), the original error must
      // surface — wrapping it in "package missing, please install" sends
      // the user on a wild goose chase.
      const original = new TypeError('webpack internal type error');
      requireFns.webpack.mockImplementation(() => {
        throw original;
      });

      expect(() =>
        webpackDefaultsFactory(
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
      const original = moduleNotFoundError('webpack');
      requireFns.webpack.mockImplementation(() => {
        throw original;
      });

      try {
        webpackDefaultsFactory(
          '/abs/src',
          'src',
          'main',
          false,
          'tsconfig.json',
          emptyPlugins,
        );
        throw new Error('expected webpackDefaultsFactory to throw');
      } catch (e) {
        expect((e as Error).cause).toBe(original);
      }
    });
  });
});
