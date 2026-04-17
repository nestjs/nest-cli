export interface BuildCommandContext {
  apps: string[];
  config?: string;
  webpack?: boolean;
  watch: boolean;
  watchAssets: boolean;
  path?: string;
  webpackPath?: string;
  rspackPath?: string;
  builder?: string;
  typeCheck?: boolean;
  emitDeclarations?: boolean;
  silent?: boolean;
  preserveWatchOutput: boolean;
  all: boolean;
  parallel?: number | boolean;
}
