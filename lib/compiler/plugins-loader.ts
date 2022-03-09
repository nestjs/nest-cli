import { join } from 'path';
import * as ts from 'typescript';
import { isObject } from 'util';
import { CLI_ERRORS } from '../ui';

const PLUGIN_ENTRY_FILENAME = 'plugin';

type Transformer = ts.TransformerFactory<any> | ts.CustomTransformerFactory;
type PluginEntry = string | PluginAndOptions;

interface PluginAndOptions {
  name: 'string';
  options: Record<string, any>;
}

export interface NestCompilerPlugin {
  before?: (options?: Record<string, any>, program?: ts.Program) => Transformer;
  after?: (options?: Record<string, any>, program?: ts.Program) => Transformer;
  afterDeclarations?: (
    options?: Record<string, any>,
    program?: ts.Program,
  ) => Transformer;
}

export interface MultiNestCompilerPlugins {
  beforeHooks: Array<(program?: ts.Program) => Transformer>;
  afterHooks: Array<(program?: ts.Program) => Transformer>;
  afterDeclarationsHooks: Array<(program?: ts.Program) => Transformer>;
}

export class PluginsLoader {
  public load(plugins: PluginEntry[] = []): MultiNestCompilerPlugins {
    const pluginNames = plugins.map((entry) =>
      isObject(entry) ? (entry as PluginAndOptions).name : (entry as string),
    );
    const nodeModulePaths = [
      join(process.cwd(), 'node_modules'),
      ...module.paths,
    ];
    const pluginRefs: NestCompilerPlugin[] = pluginNames.map((item) => {
      try {
        try {
          const binaryPath = require.resolve(
            join(item, PLUGIN_ENTRY_FILENAME),
            {
              paths: nodeModulePaths,
            },
          );
          return require(binaryPath);
        } catch {}

        const binaryPath = require.resolve(item, { paths: nodeModulePaths });
        return require(binaryPath);
      } catch (e) {
        throw new Error(`"${item}" plugin could not be found!`);
      }
    });
    const beforeHooks: MultiNestCompilerPlugins['afterHooks'] = [];
    const afterHooks: MultiNestCompilerPlugins['beforeHooks'] = [];
    const afterDeclarationsHooks: MultiNestCompilerPlugins['afterDeclarationsHooks'] =
      [];
    pluginRefs.forEach((plugin, index) => {
      if (!plugin.before && !plugin.after && !plugin.afterDeclarations) {
        throw new Error(CLI_ERRORS.WRONG_PLUGIN(pluginNames[index]));
      }
      const options = isObject(plugins[index])
        ? (plugins[index] as PluginAndOptions).options || {}
        : {};
      plugin.before &&
        beforeHooks.push(plugin.before.bind(plugin.before, options));
      plugin.after && afterHooks.push(plugin.after.bind(plugin.after, options));
      plugin.afterDeclarations &&
        afterDeclarationsHooks.push(
          plugin.afterDeclarations.bind(plugin.afterDeclarations, options),
        );
    });
    return {
      beforeHooks,
      afterHooks,
      afterDeclarationsHooks,
    };
  }
}
