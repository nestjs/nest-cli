import { describe, expect, it, vi } from 'vitest';
import * as ts from 'typescript';
import { PluginsLoader } from '../../../../lib/compiler/plugins/plugins-loader.js';

// Track ReadonlyVisitor constructor calls so individual tests can inspect
// what options the loader instantiated each visitor with.
const readonlyVisitorConstructorCalls: any[] = [];

class FakeReadonlyVisitor {
  public key = '';
  public typeImports: Record<string, string> = {};
  public receivedOptions: any;

  constructor(options: any) {
    this.receivedOptions = options;
    readonlyVisitorConstructorCalls.push(options);
  }

  visit() {
    return undefined;
  }

  collect() {
    return {};
  }
}

// Spies for the "options-tracker" plugin. They are exported here so test
// bodies can assert what arguments the bound hooks forward to them.
const optionsTrackerSpies = {
  before: vi.fn(
    (options: any, program?: ts.Program) =>
      (ctx: ts.TransformationContext) =>
      (sf: ts.SourceFile) =>
        sf,
  ),
  after: vi.fn(
    (options: any, program?: ts.Program) =>
      (ctx: ts.TransformationContext) =>
      (sf: ts.SourceFile) =>
        sf,
  ),
  afterDeclarations: vi.fn(
    (options: any, program?: ts.Program) =>
      (ctx: ts.TransformationContext) =>
      (sf: ts.SourceFile) =>
        sf,
  ),
};

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
            before:
              (options: any, program?: ts.Program) =>
              (ctx: ts.TransformationContext) =>
              (sf: ts.SourceFile) =>
                sf,
            after:
              (options: any, program?: ts.Program) =>
              (ctx: ts.TransformationContext) =>
              (sf: ts.SourceFile) =>
                sf,
          };
        }
        if (id.includes('declarations-plugin')) {
          return {
            afterDeclarations:
              (options: any, program?: ts.Program) =>
              (ctx: ts.TransformationContext) =>
              (sf: ts.SourceFile) =>
                sf,
          };
        }
        if (id.includes('readonly-plugin')) {
          return {
            before:
              (options: any, program?: ts.Program) =>
              (ctx: ts.TransformationContext) =>
              (sf: ts.SourceFile) =>
                sf,
            ReadonlyVisitor: FakeReadonlyVisitor,
          };
        }
        if (id.includes('options-tracker')) {
          return optionsTrackerSpies;
        }
        if (id.includes('invalid-plugin')) {
          return {};
        }
        return realReq(id);
      };
      mockedReq.resolve = (id: string, opts?: any) => {
        if (
          id.includes('test-plugin') ||
          id.includes('declarations-plugin') ||
          id.includes('readonly-plugin') ||
          id.includes('options-tracker') ||
          id.includes('invalid-plugin')
        ) {
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

  it('should load afterDeclarations hooks from a plugin that exports only afterDeclarations', () => {
    const loader = new PluginsLoader();
    const result = loader.load(['declarations-plugin']);

    // afterDeclarations alone is enough — the loader should not throw and
    // should not register anything in beforeHooks or afterHooks for this
    // plugin.
    expect(result.beforeHooks).toHaveLength(0);
    expect(result.afterHooks).toHaveLength(0);
    expect(result.afterDeclarationsHooks).toHaveLength(1);
    expect(typeof result.afterDeclarationsHooks[0]).toBe('function');
  });

  it('should instantiate a ReadonlyVisitor when the plugin exports one', () => {
    readonlyVisitorConstructorCalls.length = 0;

    const loader = new PluginsLoader();
    const result = loader.load(['readonly-plugin']);

    expect(result.readonlyVisitors).toHaveLength(1);
    const visitor = result.readonlyVisitors[0];
    // The loader must stamp `key` onto each visitor so downstream code can
    // identify which plugin owns the collected metadata.
    expect(visitor.key).toBe('readonly-plugin');
    expect(readonlyVisitorConstructorCalls).toHaveLength(1);
    // The loader must always force `readonly: true` on the visitor's options
    // regardless of what the user supplied.
    expect(readonlyVisitorConstructorCalls[0].readonly).toBe(true);
  });

  it('should forward extras (pathToSource) into the ReadonlyVisitor options', () => {
    readonlyVisitorConstructorCalls.length = 0;

    const loader = new PluginsLoader();
    loader.load(['readonly-plugin'], { pathToSource: '/abs/path/to/src' });

    expect(readonlyVisitorConstructorCalls).toHaveLength(1);
    expect(readonlyVisitorConstructorCalls[0].pathToSource).toBe(
      '/abs/path/to/src',
    );
  });

  it('should merge user-supplied options with extras for the ReadonlyVisitor', () => {
    readonlyVisitorConstructorCalls.length = 0;

    const loader = new PluginsLoader();
    loader.load(
      [{ name: 'readonly-plugin', options: { introspectComments: true } }],
      { pathToSource: '/another/src' },
    );

    expect(readonlyVisitorConstructorCalls).toHaveLength(1);
    const ctorOptions = readonlyVisitorConstructorCalls[0];
    expect(ctorOptions.introspectComments).toBe(true);
    expect(ctorOptions.pathToSource).toBe('/another/src');
    expect(ctorOptions.readonly).toBe(true);
  });

  it('should preserve plugin order in the returned hook arrays', () => {
    const loader = new PluginsLoader();
    const result = loader.load([
      'test-plugin', // before + after
      'declarations-plugin', // afterDeclarations
      'readonly-plugin', // before + ReadonlyVisitor
    ]);

    // `test-plugin` and `readonly-plugin` both contribute a `before` hook,
    // in that input order.
    expect(result.beforeHooks).toHaveLength(2);
    expect(result.afterHooks).toHaveLength(1);
    expect(result.afterDeclarationsHooks).toHaveLength(1);
    expect(result.readonlyVisitors).toHaveLength(1);
    expect(result.readonlyVisitors[0].key).toBe('readonly-plugin');
  });

  it('should propagate plugin options into the underlying transformer factory when the bound hook is invoked', () => {
    optionsTrackerSpies.before.mockClear();
    optionsTrackerSpies.after.mockClear();
    optionsTrackerSpies.afterDeclarations.mockClear();

    const loader = new PluginsLoader();
    const userOptions = { introspectComments: true, dtoFileNameSuffix: '.d' };
    const result = loader.load([
      { name: 'options-tracker', options: userOptions },
    ]);

    // Call the bound hooks the way the compiler does — passing only the
    // program reference. The loader must have already pre-bound the
    // user-supplied options as the first argument.
    const fakeProgram = {} as ts.Program;
    result.beforeHooks[0](fakeProgram);
    result.afterHooks[0](fakeProgram);
    result.afterDeclarationsHooks[0](fakeProgram);

    expect(optionsTrackerSpies.before).toHaveBeenCalledWith(
      userOptions,
      fakeProgram,
    );
    expect(optionsTrackerSpies.after).toHaveBeenCalledWith(
      userOptions,
      fakeProgram,
    );
    expect(optionsTrackerSpies.afterDeclarations).toHaveBeenCalledWith(
      userOptions,
      fakeProgram,
    );
  });

  it('should pass an empty options object when the plugin entry is a bare string', () => {
    optionsTrackerSpies.before.mockClear();

    const loader = new PluginsLoader();
    const result = loader.load(['options-tracker']);

    const fakeProgram = {} as ts.Program;
    result.beforeHooks[0](fakeProgram);

    expect(optionsTrackerSpies.before).toHaveBeenCalledWith({}, fakeProgram);
  });
});
