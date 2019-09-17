import * as ts from 'typescript';

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
  public load(plugins: string[]): MultiNestCompilerPlugins {
    const pluginRefs: NestCompilerPlugin[] = (plugins || []).map(name =>
      require(name),
    );
    const beforeHooks: Transformer[] = [];
    const afterHooks: Transformer[] = [];
    pluginRefs.forEach(plugin => {
      plugin.before && beforeHooks.push(plugin.before);
      plugin.after && afterHooks.push(plugin.after);
    });
    return {
      beforeHooks,
      afterHooks,
    };
  }
}
