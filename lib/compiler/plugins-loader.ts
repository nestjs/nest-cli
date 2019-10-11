import { resolve } from 'path';
import * as ts from 'typescript';
import { isObject } from 'util';
import { CLI_ERRORS } from '../ui';

type Transformer = ts.TransformerFactory<any> | ts.CustomTransformerFactory;
type PluginEntry = string | PluginAndOptions;

interface PluginAndOptions {
  name: 'string';
  options: Record<string, any>;
}

export interface NestCompilerPlugin {
  before?: (options?: Record<string, any>) => Transformer;
  after?: (options?: Record<string, any>) => Transformer;
}

export interface MultiNestCompilerPlugins {
  beforeHooks: Transformer[];
  afterHooks: Transformer[];
}

export class PluginsLoader {
  public load(plugins: PluginEntry[] = []): MultiNestCompilerPlugins {
    const pluginNames = plugins.map(entry =>
      isObject(entry) ? (entry as PluginAndOptions).name : (entry as string),
    );
    const pluginRefs: NestCompilerPlugin[] = pluginNames.map(item =>
      require(resolve(item)),
    );
    const beforeHooks: Transformer[] = [];
    const afterHooks: Transformer[] = [];
    pluginRefs.forEach((plugin, index) => {
      if (!plugin.before && !plugin.after) {
        throw new Error(CLI_ERRORS.WRONG_PLUGIN(pluginNames[index]));
      }
      const options = isObject(plugins[index])
        ? (plugins[index] as PluginAndOptions).options || {}
        : {};
      plugin.before && beforeHooks.push(plugin.before(options));
      plugin.after && afterHooks.push(plugin.after(options));
    });
    return {
      beforeHooks,
      afterHooks,
    };
  }
}
