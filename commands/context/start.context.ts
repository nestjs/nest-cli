export interface StartCommandContext {
  app?: string;
  config?: string;
  webpack?: boolean;
  watch: boolean;
  watchAssets: boolean;
  path?: string;
  webpackPath?: string;
  builder?: string;
  typeCheck?: boolean;
  silent?: boolean;
  preserveWatchOutput: boolean;
  debug?: boolean | string;
  exec?: string;
  sourceRoot?: string;
  entryFile?: string;
  shell: boolean;
  envFile: string[];
  extraFlags: string[];
}
