import * as ts from 'typescript';
import { CLI_ERRORS } from '../ui';

type Transformer = ts.TransformerFactory<any> | ts.CustomTransformerFactory;

export interface NestCompilerPlugin {
  before?: Transformer;
  after?: Transformer;
}

export interface MultiNestCompilerPlugins {
  beforeHooks: Transformer[];
  afterHooks: Transformer[];
}

export class PluginsLoader {
  public load(plugins: string[] = []): MultiNestCompilerPlugins {
    const pluginRefs: NestCompilerPlugin[] = (plugins || []).map(name =>
      require(name),
    );
    const beforeHooks: Transformer[] = [];
    const afterHooks: Transformer[] = [];
    pluginRefs.forEach((plugin, index) => {
      if (!plugin.before && !plugin.after) {
        throw new Error(CLI_ERRORS.WRONG_PLUGIN(plugins[index]));
      }
      plugin.before && beforeHooks.push(plugin.before);
      plugin.after && afterHooks.push(plugin.after);
    });
    return {
      beforeHooks,
      afterHooks,
    };
  }
}
