import { createRequire } from 'module';
import { red } from 'ansis';
import { join } from 'path';
import type * as ts from 'typescript';
import { BuildCommandContext } from '../commands/index.js';
import { AssetsManager } from '../lib/compiler/assets-manager.js';
import { deleteOutDirIfEnabled } from '../lib/compiler/helpers/delete-out-dir.js';
import { getBuilder } from '../lib/compiler/helpers/get-builder.js';
import { getRspackConfigPath } from '../lib/compiler/helpers/get-rspack-config-path.js';
import { getTscConfigPath } from '../lib/compiler/helpers/get-tsc-config.path.js';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default.js';
import { getWebpackConfigPath } from '../lib/compiler/helpers/get-webpack-config-path.js';
import { TsConfigProvider } from '../lib/compiler/helpers/tsconfig-provider.js';
import { PluginsLoader } from '../lib/compiler/plugins/plugins-loader.js';
import { TypeScriptBinaryLoader } from '../lib/compiler/typescript-loader.js';
import {
  Configuration,
  ConfigurationLoader,
  NestConfigurationLoader,
} from '../lib/configuration/index.js';
import {
  defaultOutDir,
  defaultRspackConfigFilename,
  defaultWebpackConfigFilename,
} from '../lib/configuration/defaults.js';
import { FileSystemReader } from '../lib/readers/index.js';
import { ERROR_PREFIX, INFO_PREFIX } from '../lib/ui/index.js';
import { isModuleAvailable } from '../lib/utils/is-module-available.js';
import { AbstractAction } from './abstract.action.js';
import type webpack from 'webpack';

const require = createRequire(import.meta.url);

export class BuildAction extends AbstractAction {
  protected readonly pluginsLoader = new PluginsLoader();
  protected readonly tsLoader = new TypeScriptBinaryLoader();
  protected readonly tsConfigProvider = new TsConfigProvider(this.tsLoader);
  protected readonly fileSystemReader = new FileSystemReader(process.cwd());
  protected readonly loader: ConfigurationLoader = new NestConfigurationLoader(
    this.fileSystemReader,
  );
  protected readonly assetsManager = new AssetsManager();

  public async handle(context: any) {
    const { apps, watch, watchAssets } = context as BuildCommandContext;
    try {
      await this.runBuild(apps, context, watch, watchAssets);
    } catch (err) {
      if (err instanceof Error) {
        console.error(`\n${ERROR_PREFIX} ${err.message}\n`);
      } else {
        console.error(`\n${red(err)}\n`);
      }
      process.exit(1);
    }
  }

  public async runBuild(
    apps: (string | undefined)[],
    options: Record<string, any>,
    watchMode: boolean,
    watchAssetsMode: boolean,
    isDebugEnabled = false,
    onSuccess?: () => void,
  ) {
    const configFileName = options.config as string | undefined;
    const configuration = await this.loader.load(configFileName);

    let appNames: (string | undefined)[];
    if (options.all) {
      appNames = [];
      if (configuration.projects) {
        appNames.push(...Object.keys(configuration.projects));
      }
    } else {
      appNames = apps;
    }

    if (appNames.length === 0) {
      appNames.push(undefined);
    }

    for (const appName of appNames) {
      const pathToTsconfig = getTscConfigPath(configuration, options, appName);
      const { options: tsOptions } =
        this.tsConfigProvider.getByConfigFilename(pathToTsconfig);
      const outDir = tsOptions.outDir || defaultOutDir;

      const isWebpackEnabled = getValueOrDefault<boolean>(
        configuration,
        'compilerOptions.webpack',
        appName,
        'webpack',
        options,
      );
      const builder = isWebpackEnabled
        ? { type: 'webpack' }
        : getBuilder(configuration, options, appName);

      await deleteOutDirIfEnabled(configuration, appName, outDir, tsOptions);
      this.assetsManager.copyAssets(
        configuration,
        appName,
        outDir,
        watchAssetsMode,
      );

      const typeCheck = getValueOrDefault<boolean>(
        configuration,
        'compilerOptions.typeCheck',
        appName,
        'typeCheck',
        options,
      );
      if (typeCheck && builder.type !== 'swc') {
        console.warn(
          INFO_PREFIX +
            ` "typeCheck" will not have any effect when "builder" is not "swc".`,
        );
      }

      switch (builder.type) {
        case 'tsc':
          await this.runTsc(
            watchMode,
            options,
            configuration,
            pathToTsconfig,
            appName,
            onSuccess,
          );
          break;
        case 'webpack':
          await this.runWebpack(
            configuration,
            appName,
            options,
            pathToTsconfig,
            isDebugEnabled,
            watchMode,
            onSuccess,
          );
          break;
        case 'rspack':
          await this.runRspack(
            configuration,
            appName,
            options,
            pathToTsconfig,
            isDebugEnabled,
            watchMode,
            onSuccess,
          );
          break;
        case 'swc':
          await this.runSwc(
            configuration,
            appName,
            pathToTsconfig,
            watchMode,
            options,
            tsOptions,
            onSuccess,
          );
          break;
      }
    }
  }

  private async runSwc(
    configuration: Required<Configuration>,
    appName: string | undefined,
    pathToTsconfig: string,
    watchMode: boolean,
    options: Record<string, any>,
    tsOptions: ts.CompilerOptions,
    onSuccess: (() => void) | undefined,
  ) {
    const { SwcCompiler } = await import('../lib/compiler/swc/swc-compiler.js');
    const swc = new SwcCompiler(this.pluginsLoader);
    const isSilent = !!options.silent;

    await swc.run(
      configuration,
      pathToTsconfig,
      appName,
      {
        watch: watchMode,
        typeCheck: getValueOrDefault<boolean>(
          configuration,
          'compilerOptions.typeCheck',
          appName,
          'typeCheck',
          options,
        ),
        tsOptions,
        assetsManager: this.assetsManager,
        silent: isSilent,
      },
      onSuccess,
    );
  }

  private async runWebpack(
    configuration: Required<Configuration>,
    appName: string | undefined,
    options: Record<string, any>,
    pathToTsconfig: string,
    debug: boolean,
    watchMode: boolean,
    onSuccess: (() => void) | undefined,
  ) {
    const { WebpackCompiler } =
      await import('../lib/compiler/webpack-compiler.js');
    const webpackCompiler = new WebpackCompiler(this.pluginsLoader);

    const webpackPath =
      getWebpackConfigPath(configuration, options, appName) ??
      defaultWebpackConfigFilename;

    const webpackConfigFactoryOrConfig = this.getWebpackConfigFactoryByPath(
      webpackPath,
      defaultWebpackConfigFilename,
    );

    return webpackCompiler.run(
      configuration,
      pathToTsconfig,
      appName,
      {
        options,
        webpackConfigFactoryOrConfig,
        debug,
        watchMode,
        assetsManager: this.assetsManager,
      },
      onSuccess,
    );
  }

  private async runTsc(
    watchMode: boolean,
    options: Record<string, any>,
    configuration: Required<Configuration>,
    pathToTsconfig: string,
    appName: string | undefined,
    onSuccess: (() => void) | undefined,
  ) {
    if (watchMode) {
      const { WatchCompiler } = await import('../lib/compiler/watch-compiler.js');
      const watchCompiler = new WatchCompiler(
        this.pluginsLoader,
        this.tsConfigProvider,
        this.tsLoader,
      );
      const isPreserveWatchOutputEnabled = !!options.preserveWatchOutput;

      watchCompiler.run(
        configuration,
        pathToTsconfig,
        appName,
        { preserveWatchOutput: isPreserveWatchOutputEnabled },
        onSuccess,
      );
    } else {
      const { Compiler } = await import('../lib/compiler/compiler.js');
      const compiler = new Compiler(
        this.pluginsLoader,
        this.tsConfigProvider,
        this.tsLoader,
      );

      compiler.run(
        configuration,
        pathToTsconfig,
        appName,
        undefined,
        onSuccess,
      );
      this.assetsManager.closeWatchers();
    }
  }

  private getWebpackConfigFactoryByPath(
    webpackPath: string,
    defaultPath: string,
  ): (
    config: webpack.Configuration,
    webpackRef: typeof webpack,
  ) => webpack.Configuration {
    const pathToWebpackFile = join(process.cwd(), webpackPath);
    const isWebpackFileAvailable = isModuleAvailable(pathToWebpackFile);
    if (!isWebpackFileAvailable && webpackPath === defaultPath) {
      return (_config: webpack.Configuration) => ({});
    }
    return require(pathToWebpackFile);
  }

  private async runRspack(
    configuration: Required<Configuration>,
    appName: string | undefined,
    options: Record<string, any>,
    pathToTsconfig: string,
    debug: boolean,
    watchMode: boolean,
    onSuccess: (() => void) | undefined,
  ) {
    const { RspackCompiler } = await import('../lib/compiler/rspack-compiler.js');
    const rspackCompiler = new RspackCompiler(this.pluginsLoader);

    const rspackPath =
      getRspackConfigPath(configuration, options, appName) ??
      defaultRspackConfigFilename;

    const rspackConfigFactoryOrConfig = this.getRspackConfigFactoryByPath(
      rspackPath,
      defaultRspackConfigFilename,
    );

    return rspackCompiler.run(
      configuration,
      pathToTsconfig,
      appName,
      {
        options,
        rspackConfigFactoryOrConfig,
        debug,
        watchMode,
        assetsManager: this.assetsManager,
      },
      onSuccess,
    );
  }

  private getRspackConfigFactoryByPath(
    rspackPath: string,
    defaultPath: string,
  ): (config: Record<string, any>, rspackRef: any) => Record<string, any> {
    const pathToRspackFile = join(process.cwd(), rspackPath);
    const isRspackFileAvailable = isModuleAvailable(pathToRspackFile);
    if (!isRspackFileAvailable && rspackPath === defaultPath) {
      return (_config: Record<string, any>) => ({});
    }
    return require(pathToRspackFile);
  }
}
