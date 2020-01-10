export type Asset = 'string' | AssetEntry;
export interface AssetEntry {
  include?: string;
  flat?: boolean;
  exclude?: string;
  outDir?: string;
}

interface CompilerOptions {
  tsConfigPath?: string;
  webpack?: boolean;
  webpackConfigPath?: string;
  plugins?: string[];
  assets?: string[];
  deleteOutDir?: boolean;
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
