import { join, normalize } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { Configuration } from '../../../lib/configuration/index.js';
import { BaseCompiler } from '../../../lib/compiler/base-compiler.js';
import { PluginsLoader } from '../../../lib/compiler/plugins/plugins-loader.js';

class TestCompiler extends BaseCompiler {
  public run() {}

  // Expose protected methods for testing
  public testGetPathToSource(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
  ) {
    return this.getPathToSource(configuration, tsConfigPath, appName);
  }

  public testLoadPlugins(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
  ) {
    return this.loadPlugins(configuration, tsConfigPath, appName);
  }
}

function makeConfig(
  overrides: Partial<Configuration> = {},
): Required<Configuration> {
  return {
    language: 'ts',
    sourceRoot: 'src',
    collection: '@nestjs/schematics',
    entryFile: 'main',
    exec: 'node',
    projects: {},
    monorepo: false,
    compilerOptions: {},
    generateOptions: {},
    ...overrides,
  } as Required<Configuration>;
}

describe('BaseCompiler', () => {
  describe('getPathToSource', () => {
    it('should return cwd + sourceRoot when tsconfig is in cwd', () => {
      const pluginsLoader = new PluginsLoader();
      const compiler = new TestCompiler(pluginsLoader);
      const config = makeConfig({ sourceRoot: 'src' });
      const cwd = process.cwd();

      const result = compiler.testGetPathToSource(
        config,
        'tsconfig.json',
        undefined,
      );

      expect(result).toBe(join(cwd, 'src'));
    });

    it('should use project-specific sourceRoot when appName is provided', () => {
      const pluginsLoader = new PluginsLoader();
      const compiler = new TestCompiler(pluginsLoader);
      const config = makeConfig({
        sourceRoot: 'src',
        projects: {
          'my-app': {
            sourceRoot: 'apps/my-app/src',
          },
        },
      });
      const cwd = process.cwd();

      const result = compiler.testGetPathToSource(
        config,
        'tsconfig.json',
        'my-app',
      );

      expect(result).toBe(join(cwd, 'apps/my-app/src'));
    });
  });

  describe('loadPlugins', () => {
    it('should return empty hooks when no plugins are configured', () => {
      const loadMock = vi.fn().mockReturnValue({
        beforeHooks: [],
        afterHooks: [],
        afterDeclarationsHooks: [],
        readonlyVisitors: [],
      });
      const pluginsLoader = {
        load: loadMock,
      } as unknown as PluginsLoader;
      const compiler = new TestCompiler(pluginsLoader);
      const config = makeConfig();

      const result = compiler.testLoadPlugins(
        config,
        'tsconfig.json',
        undefined,
      );

      expect(result.beforeHooks).toHaveLength(0);
      expect(result.afterHooks).toHaveLength(0);
      expect(loadMock).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ pathToSource: expect.any(String) }),
      );
    });
  });
});
