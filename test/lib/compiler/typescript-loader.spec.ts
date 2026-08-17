import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
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
