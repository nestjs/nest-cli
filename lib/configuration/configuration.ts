export interface ProjectConfiguration {
  type?: string;
  root?: string;
  entryFile?: string;
  sourceRoot?: string;
  compilerOptions?: {
    tsConfigPath?: string;
  };
}

export interface Configuration {
  [key: string]: any;
  language?: string;
  collection?: string;
  sourceRoot?: string;
  entryFile?: string;
  projects?: {
    [key: string]: ProjectConfiguration;
  };
  monorepo?: boolean;
  compilerOptions?: {
    tsConfigPath?: string;
    webpack?: boolean;
    webpackConfigPath?: string;
    plugins?: string[];
  };
}
