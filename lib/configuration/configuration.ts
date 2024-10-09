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

export interface SwcBuilderOptions {
  swcrcPath?: string;
  outDir?: string;
  filenames?: string[];
  sync?: boolean;
  extensions?: string[];
  copyFiles?: boolean;
  includeDotfiles?: boolean;
  quiet?: boolean;
}

export interface WebpackBuilderOptions {
  configPath?: string;
}

export interface TscBuilderOptions {
  configPath?: string;
}

export type BuilderVariant = 'tsc' | 'swc' | 'webpack';
export type Builder =
  | BuilderVariant
  | {
      type: 'webpack';
      options?: WebpackBuilderOptions;
    }
  | {
      type: 'swc';
      options?: SwcBuilderOptions;
    }
  | {
      type: 'tsc';
      options?: TscBuilderOptions;
    };

export interface CompilerOptions {
  tsConfigPath?: string;
  /**
   * @deprecated Use `builder` instead.
   */
  webpack?: boolean;
  /**
   * @deprecated Use `builder.options.configPath` instead.
   */
  webpackConfigPath?: string;
  plugins?: string[] | PluginOptions[];
  assets?: string[];
  deleteOutDir?: boolean;
  manualRestart?: boolean;
  builder?: Builder;
}

export interface PluginOptions {
  name: string;
  options: Record<string, any>[];
}

export interface GenerateOptions {
  spec?: boolean | Record<string, boolean>;
  flat?: boolean;
  specFileSuffix?: string;
  baseDir?: string;
}

export interface ProjectConfiguration {
  type?: string;
  root?: string;
  entryFile?: string;
  exec?: string;
  sourceRoot?: string;
  compilerOptions?: CompilerOptions;
}

export interface Configuration {
  [key: string]: any;
  language?: string;
  collection?: string;
  sourceRoot?: string;
  entryFile?: string;
  exec?: string;
  monorepo?: boolean;
  compilerOptions?: CompilerOptions;
  generateOptions?: GenerateOptions;
  projects?: {
    [key: string]: ProjectConfiguration;
  };
}
