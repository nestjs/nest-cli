import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BundleDependenciesPlugin,
  createBundleExternals,
  findExternalPackages,
  getPackageName,
  isMissingOptionalPackage,
} from '../../../../lib/compiler/defaults/bundle-dependencies.js';

describe('bundle dependencies', () => {
  let projectDir: string;

  const write = (path: string, content = '') => {
    const file = join(projectDir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  };

  const installPackage = (
    name: string,
    manifest: Record<string, any> = {},
    files: string[] = [],
  ) => {
    write(
      `node_modules/${name}/package.json`,
      JSON.stringify({ name, version: '1.2.3', ...manifest }),
    );
    files.forEach((file) => write(`node_modules/${name}/${file}`));
  };

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'nest-cli-bundle-'));
    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(projectDir, { recursive: true, force: true });
  });

  describe('getPackageName', () => {
    it.each([
      ['rxjs', 'rxjs'],
      ['rxjs/operators', 'rxjs'],
      ['@nestjs/core', '@nestjs/core'],
      ['@nestjs/websockets/socket-module.js', '@nestjs/websockets'],
    ])('should resolve %s to %s', (request, expected) => {
      expect(getPackageName(request)).toBe(expected);
    });

    it.each(['./local', '../up', '/abs/path', 'node:fs'])(
      'should return undefined for %s',
      (request) => {
        expect(getPackageName(request)).toBeUndefined();
      },
    );
  });

  describe('isMissingOptionalPackage', () => {
    it('should report an optional package that is not installed', () => {
      expect(
        isMissingOptionalPackage(
          '@nestjs/microservices/microservices-module.js',
        ),
      ).toBe(true);
      expect(isMissingOptionalPackage('class-validator')).toBe(true);
    });

    it('should not report an optional package that is installed', () => {
      installPackage('@nestjs/microservices', { type: 'module' });

      expect(
        isMissingOptionalPackage(
          '@nestjs/microservices/microservices-module.js',
        ),
      ).toBe(false);
      expect(isMissingOptionalPackage('@nestjs/microservices')).toBe(false);
    });

    it('should never report packages outside the optional list', () => {
      expect(isMissingOptionalPackage('some-missing-package')).toBe(false);
      expect(isMissingOptionalPackage('./class-validator')).toBe(false);
    });
  });

  describe('findExternalPackages', () => {
    it('should detect binding.gyp, gypfile and .node files in production dependencies', () => {
      write(
        'package.json',
        JSON.stringify({
          dependencies: { gyp: '*', flagged: '*', prebuilt: '*', plain: '*' },
          devDependencies: { 'dev-native': '*' },
        }),
      );
      installPackage('gyp', { version: '9.0.0' }, ['binding.gyp']);
      installPackage('flagged', { gypfile: true });
      installPackage('prebuilt', {}, ['prebuilds/darwin-arm64/addon.node']);
      installPackage('plain', {}, ['index.js']);
      installPackage('dev-native', {}, ['binding.gyp']);

      expect(findExternalPackages()).toEqual([
        { name: 'flagged', version: '1.2.3' },
        { name: 'gyp', version: '9.0.0' },
        { name: 'prebuilt', version: '1.2.3' },
      ]);
    });

    it('should find native packages behind transitive dependencies', () => {
      write('package.json', JSON.stringify({ dependencies: { outer: '*' } }));
      installPackage('outer', { dependencies: { inner: '*' } });
      installPackage('inner', {}, ['binding.gyp']);

      expect(findExternalPackages()).toEqual([
        { name: 'inner', version: '1.2.3' },
      ]);
    });

    it('should keep swagger-ui-dist and excluded packages external with their own dependencies', () => {
      write(
        'package.json',
        JSON.stringify({ dependencies: { swagger: '*', orm: '*' } }),
      );
      installPackage('swagger', { dependencies: { 'swagger-ui-dist': '*' } });
      installPackage('swagger-ui-dist', { version: '5.0.0' });
      installPackage('orm', {
        version: '2.0.0',
        dependencies: { driver: '*' },
      });
      installPackage('driver', {}, ['binding.gyp']);

      expect(findExternalPackages(projectDir, ['orm'])).toEqual([
        { name: 'orm', version: '2.0.0' },
        { name: 'swagger-ui-dist', version: '5.0.0' },
      ]);
    });

    it('should keep a package external when its binary comes from a platform-specific optional dependency', () => {
      write('package.json', JSON.stringify({ dependencies: { sharp: '*' } }));
      installPackage('sharp', {
        version: '0.34.0',
        optionalDependencies: {
          '@img/sharp-darwin-arm64': '*',
          '@img/sharp-linux-x64': '*',
        },
      });
      installPackage(
        '@img/sharp-darwin-arm64',
        { os: ['darwin'], cpu: ['arm64'] },
        ['lib/sharp-darwin-arm64.node'],
      );

      expect(findExternalPackages()).toEqual([
        { name: 'sharp', version: '0.34.0' },
      ]);
    });

    it('should follow the real directories of linked packages, as pnpm installs them', () => {
      write('package.json', JSON.stringify({ dependencies: { outer: '*' } }));
      installPackage('.pnpm/outer@1.2.3/node_modules/outer', {
        dependencies: { inner: '*' },
      });
      installPackage('.pnpm/inner@1.2.3/node_modules/inner', {}, [
        'binding.gyp',
      ]);
      const link = (target: string, path: string) =>
        symlinkSync(
          join(projectDir, 'node_modules', target),
          join(projectDir, 'node_modules', path),
          'dir',
        );
      link('.pnpm/outer@1.2.3/node_modules/outer', 'outer');
      link(
        '.pnpm/inner@1.2.3/node_modules/inner',
        '.pnpm/outer@1.2.3/node_modules/inner',
      );

      expect(findExternalPackages()).toEqual([
        { name: 'inner', version: '1.2.3' },
      ]);
    });

    it('should pin the version closest to the project when a package is installed twice', () => {
      write(
        'package.json',
        JSON.stringify({ dependencies: { native: '*', outer: '*' } }),
      );
      installPackage('native', { version: '2.0.0' }, ['binding.gyp']);
      installPackage('outer', { dependencies: { native: '*' } });
      installPackage('outer/node_modules/native', { version: '1.0.0' }, [
        'binding.gyp',
      ]);

      expect(findExternalPackages()).toEqual([
        { name: 'native', version: '2.0.0' },
      ]);
    });

    it('should skip uninstalled optional dependencies', () => {
      write(
        'package.json',
        JSON.stringify({ optionalDependencies: { missing: '*' } }),
      );

      expect(findExternalPackages()).toEqual([]);
    });

    it('should return an empty list without a package.json', () => {
      expect(findExternalPackages()).toEqual([]);
    });
  });

  describe('createBundleExternals', () => {
    const resolve = (
      external: ReturnType<typeof createBundleExternals>,
      request?: string,
    ) => {
      let result: string | undefined;
      external({ request }, (_error, value) => {
        result = value;
      });
      return result;
    };

    it('should load builtins and native packages with node-commonjs in ESM', () => {
      const external = createBundleExternals(true, [
        { name: 'better-sqlite3', version: '1.0.0' },
      ]);

      expect(resolve(external, 'fs')).toBe('node-commonjs fs');
      expect(resolve(external, 'fs/promises')).toBe(
        'node-commonjs fs/promises',
      );
      expect(resolve(external, 'node:stream')).toBe(
        'node-commonjs node:stream',
      );
      expect(resolve(external, 'better-sqlite3')).toBe(
        'node-commonjs better-sqlite3',
      );
      expect(resolve(external, 'better-sqlite3/lib/x.js')).toBe(
        'node-commonjs better-sqlite3/lib/x.js',
      );
    });

    it('should use commonjs externals for CommonJS output', () => {
      const external = createBundleExternals(false, [
        { name: 'better-sqlite3', version: '1.0.0' },
      ]);

      expect(resolve(external, 'path')).toBe('commonjs path');
      expect(resolve(external, 'better-sqlite3')).toBe(
        'commonjs better-sqlite3',
      );
    });

    it('should bundle everything else', () => {
      const external = createBundleExternals(true, []);

      expect(resolve(external, 'rxjs')).toBeUndefined();
      expect(resolve(external, '@nestjs/core')).toBeUndefined();
      expect(resolve(external, './local.js')).toBeUndefined();
      expect(resolve(external, undefined)).toBeUndefined();
    });
  });

  describe('BundleDependenciesPlugin', () => {
    const setup = (options: { isEsm: boolean; externalPackages?: any[] }) => {
      const taps: Record<string, any> = {};
      const emitAsset = vi.fn();
      const processAssets = {
        tap: (_options: unknown, fn: () => void) => (taps.processAssets = fn),
      };
      const compiler = {
        rspack: {
          Compilation: { PROCESS_ASSETS_STAGE_ADDITIONAL: -100 },
          sources: {
            RawSource: class {
              constructor(public readonly source: string) {}
            },
          },
        },
        hooks: {
          thisCompilation: {
            tap: (_name: string, fn: (c: unknown) => void) =>
              fn({ hooks: { processAssets }, emitAsset }),
          },
          done: { tap: (_name: string, fn: unknown) => (taps.done = fn) },
        },
      };
      const ignored = new Set<string>();
      new BundleDependenciesPlugin({
        isEsm: options.isEsm,
        externalPackages: options.externalPackages ?? [],
        ignored,
      }).apply(compiler);
      return { taps, emitAsset, ignored };
    };

    it('should emit a package.json with pinned native packages and an ESM type', () => {
      const { taps, emitAsset } = setup({
        isEsm: true,
        externalPackages: [{ name: 'better-sqlite3', version: '12.11.1' }],
      });

      taps.processAssets();

      const [name, source] = emitAsset.mock.calls[0];
      expect(name).toBe('package.json');
      expect(JSON.parse(source.source)).toEqual({
        private: true,
        type: 'module',
        dependencies: { 'better-sqlite3': '12.11.1' },
      });
    });

    it('should emit a commonjs type for CommonJS output', () => {
      const { taps, emitAsset } = setup({ isEsm: false });

      taps.processAssets();

      expect(JSON.parse(emitAsset.mock.calls[0][1].source)).toMatchObject({
        type: 'commonjs',
        dependencies: {},
      });
    });

    it('should list ignored optional packages and externals after a build', () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { taps, ignored } = setup({
        isEsm: true,
        externalPackages: [{ name: 'better-sqlite3', version: '12.11.1' }],
      });
      ignored.add('kafkajs');
      ignored.add('@nestjs/microservices');

      taps.done({ hasErrors: () => false });

      const output = log.mock.calls[0][0] as string;
      expect(output).toContain('@nestjs/microservices, kafkajs');
      expect(output).toContain('better-sqlite3@12.11.1');
    });

    it('should stay silent when the build failed', () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { taps } = setup({ isEsm: true });

      taps.done({ hasErrors: () => true });

      expect(log).not.toHaveBeenCalled();
    });
  });
});
