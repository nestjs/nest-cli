import { describe, expect, it, vi } from 'vitest';
import * as ts from 'typescript';
import { PluginsLoader } from '../../../../lib/compiler/plugins/plugins-loader.js';

// Mock module resolution to avoid filesystem access
vi.mock('module', async (importOriginal) => {
  const actual = await importOriginal<typeof import('module')>();
  return {
    ...actual,
    createRequire: (url: string | URL) => {
      const realReq = actual.createRequire(url);
      const mockedReq: any = (id: string) => {
        if (id.includes('test-plugin')) {
          return {
            before: (options: any, program?: ts.Program) =>
              (ctx: ts.TransformationContext) =>
                (sf: ts.SourceFile) =>
                  sf,
            after: (options: any, program?: ts.Program) =>
              (ctx: ts.TransformationContext) =>
                (sf: ts.SourceFile) =>
                  sf,
          };
        }
        if (id.includes('invalid-plugin')) {
          return {};
        }
        return realReq(id);
      };
      mockedReq.resolve = (id: string, opts?: any) => {
        if (id.includes('test-plugin') || id.includes('invalid-plugin')) {
          return id;
        }
        return realReq.resolve(id, opts);
      };
      mockedReq.resolve.paths = realReq.resolve.paths?.bind(realReq.resolve);
      return mockedReq;
    },
  };
});

describe('PluginsLoader', () => {
  it('should return empty hooks when no plugins are provided', () => {
    const loader = new PluginsLoader();
    const result = loader.load([]);

    expect(result.beforeHooks).toEqual([]);
    expect(result.afterHooks).toEqual([]);
    expect(result.afterDeclarationsHooks).toEqual([]);
    expect(result.readonlyVisitors).toEqual([]);
  });

  it('should return empty hooks when plugins is undefined', () => {
    const loader = new PluginsLoader();
    const result = loader.load();

    expect(result.beforeHooks).toHaveLength(0);
    expect(result.afterHooks).toHaveLength(0);
  });

  it('should load before and after hooks from a valid plugin', () => {
    const loader = new PluginsLoader();
    const result = loader.load(['test-plugin']);

    expect(result.beforeHooks).toHaveLength(1);
    expect(result.afterHooks).toHaveLength(1);
    expect(typeof result.beforeHooks[0]).toBe('function');
    expect(typeof result.afterHooks[0]).toBe('function');
  });

  it('should throw for a plugin that exports no hooks', () => {
    const loader = new PluginsLoader();
    expect(() => loader.load(['invalid-plugin'])).toThrow(/plugin/i);
  });

  it('should throw for a plugin that is not installed', () => {
    const loader = new PluginsLoader();
    expect(() =>
      loader.load(['@nonexistent/plugin-that-does-not-exist']),
    ).toThrow(/not installed/i);
  });

  it('should handle plugin options from object format', () => {
    const loader = new PluginsLoader();
    const result = loader.load([
      { name: 'test-plugin', options: { introspectComments: true } },
    ]);

    expect(result.beforeHooks).toHaveLength(1);
    expect(typeof result.beforeHooks[0]).toBe('function');
  });
});
