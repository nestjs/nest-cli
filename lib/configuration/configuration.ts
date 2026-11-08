export type Asset = string | AssetEntry;
export interface AssetEntry {
  glob: string;
  include?: string;
  flat?: boolean;
  exclude?: string;
  outDir?: string;
  watchAssets?: boolean;
  // Defaults to true: a change restarts the app in watch mode.
  restartOnChange?: boolean;
}

export interface ActionOnFile {
  action: 'change' | 'unlink';
  item: AssetEntry;
  path: string;
  sourceRoot: string;
  watchAssetsMode: boolean;
  confinePathsToProject: boolean;
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

export interface BundleDependenciesOptions {
  /**
   * Packages to leave out of the bundle. They stay external together with
   * their own dependencies and are pinned in the generated `package.json`.
   */
  exclude?: string[];
}

export interface RspackBuilderOptions {
  configPath?: string;
  /**
   * Bundle `node_modules` into the output instead of leaving them external.
   *
   * - `false` (default): only the app is compiled, `node_modules` are
   *   installed next to it as before.
   * - `true`: every dependency is bundled except Node builtins, packages with
   *   native addons and packages that read their own files at runtime
   *   (`swagger-ui-dist`). Those are pinned in a generated `package.json`
   *   next to the bundle, to be installed with `npm install --omit=dev`.
   * - `{ exclude: [...] }`: like `true`, but the listed packages stay
   *   external as well, for dependencies that do not survive bundling
   *   (dynamic `require` of user files, globs, own native loaders).
   *
   * Optional packages that are not installed are ignored.
   */
  bundleDependencies?: boolean | BundleDependenciesOptions;
}

export interface TscBuilderOptions {
  configPath?: string;
}

export type BuilderVariant = 'tsc' | 'swc' | 'webpack' | 'rspack';
export type Builder =
  | BuilderVariant
  | {
      type: 'webpack';
      options?: WebpackBuilderOptions;
    }
  | {
      type: 'rspack';
      options?: RspackBuilderOptions;
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
  assets?: Asset[];
  deleteOutDir?: boolean;
  allowOutsidePaths?: boolean;
  manualRestart?: boolean;
  builder?: Builder;
  emitDeclarations?: boolean;
  /**
   * List of library project names whose assets should also be copied
   * when building this application.
   */
  includeLibraryAssets?: string[];
}

export interface PluginOptions {
  name: string;
  options: Record<string, any>;
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
  generateOptions?: GenerateOptions;
}

export interface Configuration {
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
