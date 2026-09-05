import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import * as ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TypeScriptBinaryLoader } from '../../../lib/compiler/typescript-loader.js';
import { CLI_ERRORS } from '../../../lib/ui/index.js';

describe('TypeScriptBinaryLoader', () => {
  it('should load the typescript binary', () => {
    const loader = new TypeScriptBinaryLoader();
    const tsBinary = loader.load();
    expect(tsBinary).toBeDefined();
    expect(typeof tsBinary.createProgram).toBe('function');
  });

  it('should return the same cached instance on subsequent calls', () => {
    const loader = new TypeScriptBinaryLoader();
    const first = loader.load();
    const second = loader.load();
    expect(first).toBe(second);
  });

  it('should expose TypeScript namespace utilities', () => {
    const loader = new TypeScriptBinaryLoader();
    const tsBinary = loader.load();
    expect(tsBinary.sys).toBeDefined();
    expect(tsBinary.ScriptTarget).toBeDefined();
    expect(tsBinary.ModuleKind).toBeDefined();
  });

  it('should return the same TypeScript instance used by the test process', () => {
    const loader = new TypeScriptBinaryLoader();
    const tsBinary = loader.load();
    // Both should have the same version string since they resolve from
    // the same node_modules/typescript.
    expect(tsBinary.version).toBe(ts.version);
  });

  it('getModulePaths should return an array of resolution paths', () => {
    const loader = new TypeScriptBinaryLoader();
    const paths = loader.getModulePaths();
    expect(Array.isArray(paths)).toBe(true);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every((p) => typeof p === 'string')).toBe(true);
  });

  describe('programmatic API support', () => {
    it('should load the installed TypeScript that exposes the compiler API', () => {
      const loader = new TypeScriptBinaryLoader();
      const tsBinary = loader.load();
      expect(typeof tsBinary.getParsedCommandLineOfConfigFile).toBe('function');
    });

    it('should not throw for a TypeScript build exposing the programmatic API', () => {
      const loader = new TypeScriptBinaryLoader();
      const supportedBinary = {
        version: '6.0.3',
        getParsedCommandLineOfConfigFile: () => ({}),
      } as any;
      expect(() =>
        (loader as any).assertProgrammaticApiIsSupported(supportedBinary),
      ).not.toThrow();
    });

    it('should throw an actionable error when the programmatic API is missing (TypeScript 7)', () => {
      const loader = new TypeScriptBinaryLoader();
      const nativeBinary = { version: '7.0.2', sys: {} } as any;
      expect(() =>
        (loader as any).assertProgrammaticApiIsSupported(nativeBinary),
      ).toThrow(CLI_ERRORS.UNSUPPORTED_TYPESCRIPT_VERSION('7.0.2'));
    });
  });
});

describe('TypeScriptBinaryLoader (native API, TypeScript 7.1+)', () => {
  it('reports the classic programmatic API for the installed TypeScript 6', () => {
    const loader = new TypeScriptBinaryLoader();
    expect(loader.hasProgrammaticApi()).toBe(true);
    expect(loader.isNativeApiRequired()).toBe(false);
  });

  it('does not require the native API when the classic one is present', () => {
    const loader = new TypeScriptBinaryLoader();
    expect(loader.isNativeApiRequired()).toBe(false);
  });

  it('creates one shared API session and closes it', () => {
    const loader = new TypeScriptBinaryLoader();
    const close = vi.fn();
    const API = vi.fn(function () {
      return { close };
    });
    (loader as any).nativeModule = {
      API,
      formatDiagnosticsWithColorAndContext: vi.fn(),
    };

    const first = loader.loadNativeApi();
    const second = loader.loadNativeApi();
    expect(first).toBe(second);
    expect(API).toHaveBeenCalledTimes(1);
    expect(API).toHaveBeenCalledWith({ cwd: process.cwd() });

    loader.closeNativeApi();
    expect(close).toHaveBeenCalledTimes(1);
    expect(loader.loadNativeApi()).not.toBe(first);
  });
});

describe('TypeScriptBinaryLoader (installed TypeScript detection)', () => {
  const originalCwd = process.cwd();
  let projectDir: string;

  const installFakeTypeScript = (files: Record<string, string>) => {
    const pkgDir = join(projectDir, 'node_modules', 'typescript');
    for (const [relativePath, content] of Object.entries(files)) {
      const target = join(pkgDir, relativePath);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
  };

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'nest-cli-ts-loader-'));
    process.chdir(projectDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(projectDir, { recursive: true, force: true });
  });

  it('treats TypeScript 7.0 (executable only) as unsupported and does not require the native API', () => {
    installFakeTypeScript({
      'package.json': JSON.stringify({
        name: 'typescript',
        version: '7.0.2',
        exports: {
          '.': './lib/version.cjs',
          './package.json': './package.json',
        },
      }),
      'lib/version.cjs':
        'module.exports = { version: "7.0.2", versionMajorMinor: "7.0" };',
    });
    const loader = new TypeScriptBinaryLoader();

    expect(loader.hasProgrammaticApi()).toBe(false);
    expect(loader.hasNativeApi()).toBe(false);
    expect(loader.isNativeApiRequired()).toBe(false);
    expect(() => loader.load()).toThrow(
      CLI_ERRORS.UNSUPPORTED_TYPESCRIPT_VERSION('7.0.2'),
    );
    expect(() => loader.loadNativeApi()).toThrow(
      CLI_ERRORS.UNSUPPORTED_TYPESCRIPT_VERSION('7.0.2'),
    );
  });

  it('detects the native API of TypeScript 7.1+ through "typescript/unstable/sync"', () => {
    installFakeTypeScript({
      'package.json': JSON.stringify({
        name: 'typescript',
        version: '7.1.0-dev.1',
        exports: {
          '.': './lib/version.cjs',
          './package.json': './package.json',
          './unstable/sync': './dist/api/sync/api.js',
        },
      }),
      'lib/version.cjs':
        'module.exports = { version: "7.1.0-dev.1", versionMajorMinor: "7.1" };',
      'dist/api/sync/api.js':
        'class API { constructor(o) { this.options = o; } close() {} }\n' +
        'module.exports = { API, formatDiagnosticsWithColorAndContext: () => "" };',
    });
    const loader = new TypeScriptBinaryLoader();

    expect(loader.hasProgrammaticApi()).toBe(false);
    expect(loader.hasNativeApi()).toBe(true);
    expect(loader.isNativeApiRequired()).toBe(true);
    const api = loader.loadNativeApi() as any;
    expect(api.options).toEqual({ cwd: process.cwd() });
    // Features that still need the classic API get a dedicated message.
    expect(() => loader.load()).toThrow(
      CLI_ERRORS.CLASSIC_API_REQUIRED_ON_NATIVE_TYPESCRIPT('7.1.0-dev.1'),
    );
    loader.closeNativeApi();
  });

  it('ignores an "unstable/sync" entry that does not look like the native API', () => {
    installFakeTypeScript({
      'package.json': JSON.stringify({
        name: 'typescript',
        version: '7.1.0-dev.1',
        exports: {
          '.': './lib/version.cjs',
          './unstable/sync': './dist/api/sync/api.js',
        },
      }),
      'lib/version.cjs': 'module.exports = { version: "7.1.0-dev.1" };',
      'dist/api/sync/api.js': 'module.exports = { somethingElse: true };',
    });
    const loader = new TypeScriptBinaryLoader();

    expect(loader.hasNativeApi()).toBe(false);
    expect(loader.isNativeApiRequired()).toBe(false);
  });

  it('prefers the classic API when TypeScript 6 is installed', () => {
    installFakeTypeScript({
      'package.json': JSON.stringify({
        name: 'typescript',
        version: '6.0.3',
        main: './lib/typescript.js',
      }),
      'lib/typescript.js':
        'module.exports = { version: "6.0.3", getParsedCommandLineOfConfigFile() {}, sys: {} };',
    });
    const loader = new TypeScriptBinaryLoader();

    expect(loader.hasProgrammaticApi()).toBe(true);
    expect(loader.isNativeApiRequired()).toBe(false);
    expect(loader.load().version).toBe('6.0.3');
  });
});
