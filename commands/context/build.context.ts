export interface BuildCommandContext {
  apps: string[];
  config?: string;
  webpack?: boolean;
  watch: boolean;
  watchAssets: boolean;
  path?: string;
  webpackPath?: string;
  builder?: string;
  typeCheck?: boolean;
  preserveWatchOutput: boolean;
  all: boolean;
}
