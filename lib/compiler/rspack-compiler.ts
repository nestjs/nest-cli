import { existsSync } from 'fs';
import { createRequire } from 'module';
import { resolve } from 'path';
import type * as ts from 'typescript';
import { CompilerOptions, Configuration } from '../configuration/index.js';
import { INFO_PREFIX } from '../ui/index.js';
import { isEsmProject } from '../utils/is-esm-project.js';
import { AssetsManager } from './assets-manager.js';
import { BaseCompiler } from './base-compiler.js';
import { rspackDefaultsFactory } from './defaults/rspack-defaults.js';
import {
  BundlerCallbackCompletion,
  createBundlerAfterCallback,
} from './helpers/bundler-callback.js';
import { getValueOrDefault } from './helpers/get-value-or-default.js';
import {
  MultiNestCompilerPlugins,
  PluginsLoader,
} from './plugins/plugins-loader.js';

const require = createRequire(import.meta.url);

export type RspackConfigFactory = (
  config: Record<string, any>,
  rspackRef: any,
) => Record<string, any>;

export type RspackConfigFactoryOrConfig =
  RspackConfigFactory | Record<string, any>;

export type RspackCompilerExtras = {
  options: Record<string, any>;
  assetsManager: AssetsManager;
  rspackConfigFactoryOrConfig:
    RspackConfigFactoryOrConfig | RspackConfigFactoryOrConfig[];
  debug?: boolean;
  watchMode?: boolean;
  tsOptions?: ts.CompilerOptions;
};

export class RspackCompiler extends BaseCompiler<RspackCompilerExtras> {
  constructor(pluginsLoader: PluginsLoader) {
    super(pluginsLoader);
  }

  public run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: RspackCompilerExtras,
    onSuccess?: () => void,
  ) {
    const cwd = process.cwd();
    const configPath = resolve(cwd, tsConfigPath!);
    if (!existsSync(configPath)) {
      throw new Error(
        `Could not find TypeScript configuration file "${tsConfigPath!}".`,
      );
    }

    const plugins = this.loadPlugins(configuration, tsConfigPath, appName);
    const pathToSource = this.getPathToSource(
      configuration,
      tsConfigPath,
      appName,
    );

    const entryFile = getValueOrDefault<string>(
      configuration,
      'entryFile',
      appName,
      'entryFile',
      extras.options,
    );
    const entryFileRoot =
      getValueOrDefault<string>(configuration, 'root', appName) || '';
    const bundleDependencies = getBundleDependencies(
      configuration,
      extras.options,
      appName,
    );
    const typeCheck = getTypeCheck(configuration, extras.options, appName);
    const rawPlugins = getValueOrDefault<Array<string | { name: string }>>(
      configuration,
      'compilerOptions.plugins',
      appName,
    );
    const configuredPlugins = Array.isArray(rawPlugins) ? rawPlugins : [];
    this.reportPluginCapabilities(
      configuredPlugins,
      plugins,
      typeCheck,
      Boolean(extras.options?.silent),
    );

    const defaultOptions = rspackDefaultsFactory(
      pathToSource,
      entryFileRoot,
      entryFile,
      extras.debug ?? false,
      configPath,
      plugins,
      isEsmProject(),
      extras.tsOptions,
      bundleDependencies,
    );

    let rspack: any;
    try {
      rspack = require('@rspack/core');
    } catch {
      throw new Error(
        '@rspack/core is not installed. To use the rspack compiler, install the required packages:\n\n' +
          '  npm install --save-dev @rspack/core webpack-node-externals\n',
      );
    }

    let compiler: any;
    let watchOptions: any;
    let watch: boolean | undefined;

    if (Array.isArray(extras.rspackConfigFactoryOrConfig)) {
      const rspackConfigurations = extras.rspackConfigFactoryOrConfig.map(
        (configOrFactory) => {
          const unwrappedConfig =
            typeof configOrFactory !== 'function'
              ? configOrFactory
              : configOrFactory(defaultOptions, rspack);
          return {
            ...defaultOptions,
            mode: extras.watchMode ? 'development' : defaultOptions.mode,
            ...unwrappedConfig,
          };
        },
      );
      compiler = rspack.rspack(rspackConfigurations);
      watchOptions = rspackConfigurations.map(
        (config: any) => config.watchOptions || {},
      );
      watch = rspackConfigurations.some((config: any) => config.watch);
    } else {
      const projectRspackOptions =
        typeof extras.rspackConfigFactoryOrConfig !== 'function'
          ? extras.rspackConfigFactoryOrConfig
          : extras.rspackConfigFactoryOrConfig(defaultOptions, rspack);
      const rspackConfiguration = {
        ...defaultOptions,
        mode: extras.watchMode ? 'development' : defaultOptions.mode,
        ...projectRspackOptions,
      };
      compiler = rspack.rspack(rspackConfiguration);
      watchOptions = rspackConfiguration.watchOptions;
      watch = rspackConfiguration.watch;
    }

    if (extras.watchMode || watch) {
      if (typeCheck) {
        this.runTypeChecker(configuration, tsConfigPath, appName, {
          watch: true,
          typeCheck: true,
        });
      }
      const afterCallback = this.createAfterCallback(
        onSuccess,
        extras.assetsManager,
        extras.watchMode ?? false,
        watch,
      );
      compiler.hooks.watchRun.tapAsync(
        'Rebuild info',
        (params: any, callback: () => void) => {
          console.log(`\n${INFO_PREFIX} Rspack is building your sources...\n`);
          callback();
        },
      );
      compiler.watch(watchOptions! || {}, afterCallback);
    } else {
      return new Promise<void>((resolve, reject) => {
        const afterCallback = this.createAfterCallback(
          onSuccess,
          extras.assetsManager,
          extras.watchMode ?? false,
          watch,
          { resolve, reject },
        );
        const executeRspackRun = () => compiler.run(afterCallback);
        if (typeCheck) {
          Promise.resolve(
            this.runTypeChecker(configuration, tsConfigPath, appName, {
              watch: false,
              typeCheck: true,
            }),
          )
            .then(executeRspackRun)
            .catch(async (error) => {
              if (!onSuccess) {
                await extras.assetsManager.closeWatchers();
              }
              reject(error);
            });
        } else {
          executeRspackRun();
        }
      });
    }
  }

  private createAfterCallback(
    onSuccess: (() => void) | undefined,
    assetsManager: AssetsManager,
    watchMode: boolean,
    watch: boolean | undefined,
    onComplete?: BundlerCallbackCompletion,
  ) {
    return createBundlerAfterCallback({
      bundlerName: 'Rspack',
      onSuccess,
      assetsManager,
      watchMode,
      watch,
      onComplete,
    });
  }

  private reportPluginCapabilities(
    configuredPlugins: Array<string | { name: string }>,
    plugins: MultiNestCompilerPlugins,
    typeCheck: boolean,
    silent: boolean,
  ): void {
    if (silent || configuredPlugins.length === 0) {
      return;
    }

    const pluginNames = configuredPlugins.map((entry) =>
      typeof entry === 'string' ? entry : entry.name,
    );
    const visitorKeys = new Set(
      (plugins?.readonlyVisitors ?? []).map((visitor) => visitor.key),
    );
    const visitorNames = pluginNames.filter((name) => visitorKeys.has(name));
    const transformerOnlyNames = pluginNames.filter(
      (name) => !visitorKeys.has(name),
    );

    if (!typeCheck) {
      if (visitorNames.length > 0) {
        const transformerNote =
          transformerOnlyNames.length > 0
            ? ` AST-transformer-only plugin(s) (${transformerOnlyNames.join(', ')}) cannot run in "rspack".`
            : '';
        console.warn(
          `${INFO_PREFIX} CLI plugin metadata generation is disabled for "rspack". Pass "--type-check" or set "compilerOptions.typeCheck": true to generate metadata.ts for: ${visitorNames.join(', ')}.${transformerNote}`,
        );
      } else {
        console.warn(
          `${INFO_PREFIX} "plugins" (${transformerOnlyNames.join(', ')}) will not have any effect when "builder" is "rspack" because "builtin:swc-loader" does not execute TypeScript AST transformers.`,
        );
      }
      return;
    }

    if (visitorKeys.size === 0) {
      console.warn(
        `${INFO_PREFIX} "typeCheck" is enabled, but none of the configured plugins (${transformerOnlyNames.join(', ')}) expose a ReadonlyVisitor. Skipping metadata generation.`,
      );
      return;
    }

    if (transformerOnlyNames.length > 0) {
      console.warn(
        `${INFO_PREFIX} Ignoring AST-transformer-only plugin(s) in "rspack" (${transformerOnlyNames.join(', ')}); metadata generation will run only for ReadonlyVisitor plugin(s): ${[...visitorKeys].join(', ')}.`,
      );
    }
  }
}

function getTypeCheck(
  configuration: Required<Configuration>,
  cmdOptions: Record<string, any>,
  appName: string | undefined,
): boolean {
  const flag: boolean | undefined = cmdOptions?.typeCheck;
  if (flag !== undefined) {
    return flag;
  }
  return Boolean(
    getValueOrDefault<boolean>(
      configuration,
      'compilerOptions.typeCheck',
      appName,
    ),
  );
}

function getBundleDependencies(
  configuration: Required<Configuration>,
  cmdOptions: Record<string, any>,
  appName: string | undefined,
): CompilerOptions['bundleDependencies'] {
  const configured =
    getValueOrDefault<CompilerOptions['bundleDependencies']>(
      configuration,
      'compilerOptions.bundleDependencies',
      appName,
    ) || false;
  const flag: boolean | undefined = cmdOptions.bundleDependencies;
  // `--bundle-dependencies` keeps a configured `exclude` list
  return flag === undefined || (flag && configured) ? configured : flag;
}
