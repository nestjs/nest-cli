import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { TypeScriptBinaryLoader } from '../../../lib/compiler/typescript-loader.js';

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
});
