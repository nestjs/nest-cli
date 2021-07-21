export type Asset = 'string' | AssetEntry;
export interface AssetEntry {
  glob: string;
  include?: string;
  flat?: boolean;
  exclude?: string;
  outDir?: string;
  watchAssets?: boolean;
}

export interface ActionOnFile {
  action: 'change' | 'unlink';
  item: AssetEntry;
  path: string;
  sourceRoot: string;
  watchAssetsMode: boolean;
}

interface CompilerOptions {
  tsConfigPath?: string;
  webpack?: boolean;
  webpackConfigPath?: string;
  plugins?: string[] | PluginOptions[];
  assets?: string[];
  deleteOutDir?: boolean;
}

interface PluginOptions {
  name: string;
  options: Record<string, any>[];
}

interface GenerateOptions {
  spec?: boolean | Record<string, boolean>;
}

export interface ProjectConfiguration {
  type?: string;
  root?: string;
  entryFile?: string;
  sourceRoot?: string;
  compilerOptions?: CompilerOptions;
}

export interface Configuration {
  [key: string]: any;
  language?: string;
  collection?: string;
  sourceRoot?: string;
  entryFile?: string;
  monorepo?: boolean;
  compilerOptions?: CompilerOptions;
  generateOptions?: GenerateOptions;
  projects?: {
    [key: string]: ProjectConfiguration;
  };
}
