export interface Configuration {
  [key: string]: any;
  language?: string;
  collection?: string;
  sourceRoot?: string;
  entryFile?: string;
  compilerOptions?: {
    tsConfigPath?: string;
    webpack?: boolean;
    webpackConfigPath?: string;
    plugins?: string[];
  };
}
