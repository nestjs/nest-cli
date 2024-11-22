import * as chalk from 'chalk';
import { join } from 'path';
import * as ts from 'typescript';
import { Input } from '../commands';
import { AssetsManager } from '../lib/compiler/assets-manager';
import { deleteOutDirIfEnabled } from '../lib/compiler/helpers/delete-out-dir';
import { getBuilder } from '../lib/compiler/helpers/get-builder';
import { getTscConfigPath } from '../lib/compiler/helpers/get-tsc-config.path';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default';
import { getWebpackConfigPath } from '../lib/compiler/helpers/get-webpack-config-path';
import { TsConfigProvider } from '../lib/compiler/helpers/tsconfig-provider';
import { PluginsLoader } from '../lib/compiler/plugins/plugins-loader';
import { TypeScriptBinaryLoader } from '../lib/compiler/typescript-loader';
import {
  Configuration,
  ConfigurationLoader,
  NestConfigurationLoader,
} from '../lib/configuration';
import {
  defaultOutDir,
  defaultWebpackConfigFilename,
} from '../lib/configuration/defaults';
import { FileSystemReader } from '../lib/readers';
import { ERROR_PREFIX, INFO_PREFIX } from '../lib/ui';
import { isModuleAvailable } from '../lib/utils/is-module-available';
import { AbstractAction } from './abstract.action';
import webpack = require('webpack');

export class BuildAction extends AbstractAction {
  protected readonly pluginsLoader = new PluginsLoader();
  protected readonly tsLoader = new TypeScriptBinaryLoader();
  protected readonly tsConfigProvider = new TsConfigProvider(this.tsLoader);
  protected readonly fileSystemReader = new FileSystemReader(process.cwd());
  protected readonly loader: ConfigurationLoader = new NestConfigurationLoader(
    this.fileSystemReader,
  );
  protected readonly assetsManager = new AssetsManager();

  public async handle(commandInputs: Input[], commandOptions: Input[]) {
    try {
      const watchModeOption = commandOptions.find(
        (option) => option.name === 'watch',
      );
      const watchMode = !!(watchModeOption && watchModeOption.value);

      const watchAssetsModeOption = commandOptions.find(
        (option) => option.name === 'watchAssets',
      );
      const watchAssetsMode = !!(
        watchAssetsModeOption && watchAssetsModeOption.value
      );

      await this.runBuild(
        commandInputs,
        commandOptions,
        watchMode,
        watchAssetsMode,
      );
    } catch (err) {
      if (err instanceof Error) {
        console.log(`\n${ERROR_PREFIX} ${err.message}\n`);
      } else {
        console.error(`\n${chalk.red(err)}\n`);
      }
      process.exit(1);
    }
  }

  public async runBuild(
    commandInputs: Input[],
    commandOptions: Input[],
    watchMode: boolean,
    watchAssetsMode: boolean,
    isDebugEnabled = false,
    onSuccess?: () => void,
  ) {
    const configFileName = commandOptions.find(
      (option) => option.name === 'config',
    )!.value as string;
    const configuration = await this.loader.load(configFileName);

    const buildAll = commandOptions.find((opt) => opt.name === 'all')!
      .value as boolean;

    let appNames: (string | undefined)[];
    if (buildAll) {
      // If the "all" flag is set, we need to build all projects in a monorepo.
      appNames = [];

      if (configuration.projects) {
        appNames.push(...Object.keys(configuration.projects));
      }
    } else {
      appNames = commandInputs
        .filter((input) => input.name === 'app')
        .map((input) => input.value) as string[];
    }

    if (appNames.length === 0) {
      // If there are no projects, use "undefined" to build the default project.
      appNames.push(undefined);
    }

    for (const appName of appNames) {
      const pathToTsconfig = getTscConfigPath(
        configuration,
        commandOptions,
        appName,
      );
      const { options: tsOptions } =
        this.tsConfigProvider.getByConfigFilename(pathToTsconfig);
      const outDir = tsOptions.outDir || defaultOutDir;

      const isWebpackEnabled = getValueOrDefault<boolean>(
        configuration,
        'compilerOptions.webpack',
        appName,
        'webpack',
        commandOptions,
      );
      const builder = isWebpackEnabled
        ? { type: 'webpack' }
        : getBuilder(configuration, commandOptions, appName);

      await deleteOutDirIfEnabled(configuration, appName, outDir);
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
        commandOptions,
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
            commandOptions,
            configuration,
            pathToTsconfig,
            appName,
          );
          break;
        case 'webpack':
          await this.runWebpack(
            configuration,
            appName,
            commandOptions,
            pathToTsconfig,
            isDebugEnabled,
            watchMode,
          );
          break;
        case 'swc':
          await this.runSwc(
            configuration,
            appName,
            pathToTsconfig,
            watchMode,
            commandOptions,
            tsOptions,
          );
          break;
      }
    }

    onSuccess?.();
  }

  private async runSwc(
    configuration: Required<Configuration>,
    appName: string | undefined,
    pathToTsconfig: string,
    watchMode: boolean,
    options: Input[],
    tsOptions: ts.CompilerOptions,
  ) {
    const { SwcCompiler } = await import('../lib/compiler/swc/swc-compiler');
    const swc = new SwcCompiler(this.pluginsLoader);

    return new Promise<void>((onSuccess, onError) => {
      try {
        swc.run(
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
          },
          onSuccess,
        );
      } catch (error) {
        onError(error);
      }
    });
  }

  private async runWebpack(
    configuration: Required<Configuration>,
    appName: string | undefined,
    commandOptions: Input[],
    pathToTsconfig: string,
    debug: boolean,
    watchMode: boolean,
  ) {
    const { WebpackCompiler } = await import(
      '../lib/compiler/webpack-compiler'
    );
    const webpackCompiler = new WebpackCompiler(this.pluginsLoader);

    const webpackPath =
      getWebpackConfigPath(configuration, commandOptions, appName) ??
      defaultWebpackConfigFilename;

    const webpackConfigFactoryOrConfig = this.getWebpackConfigFactoryByPath(
      webpackPath,
      defaultWebpackConfigFilename,
    );

    return new Promise<void>((onSuccess, onError) => {
      try {
        return webpackCompiler.run(
          configuration,
          pathToTsconfig,
          appName,
          {
            inputs: commandOptions,
            webpackConfigFactoryOrConfig,
            debug,
            watchMode,
            assetsManager: this.assetsManager,
          },
          onSuccess,
        );
      } catch (error) {
        onError(error);
      }
    });
  }

  private async runTsc(
    watchMode: boolean,
    options: Input[],
    configuration: Required<Configuration>,
    pathToTsconfig: string,
    appName: string | undefined,
  ) {
    if (watchMode) {
      const { WatchCompiler } = await import('../lib/compiler/watch-compiler');
      const watchCompiler = new WatchCompiler(
        this.pluginsLoader,
        this.tsConfigProvider,
        this.tsLoader,
      );
      const isPreserveWatchOutputEnabled = options.find(
        (option) =>
          option.name === 'preserveWatchOutput' && option.value === true,
      )?.value as boolean | undefined;

      return new Promise<void>((onSuccess, onError) => {
        try {
          watchCompiler.run(
            configuration,
            pathToTsconfig,
            appName,
            { preserveWatchOutput: isPreserveWatchOutputEnabled },
            onSuccess,
          );
        } catch (error) {
          onError(error);
        }
      });
    } else {
      const { Compiler } = await import('../lib/compiler/compiler');
      const compiler = new Compiler(
        this.pluginsLoader,
        this.tsConfigProvider,
        this.tsLoader,
      );

      return new Promise<void>((onSuccess, onError) => {
        try {
          compiler.run(
            configuration,
            pathToTsconfig,
            appName,
            undefined,
            onSuccess,
          );
          this.assetsManager.closeWatchers();
        } catch (error) {
          onError(error);
        }
      });
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
      return ({}) => ({});
    }
    return require(pathToWebpackFile);
  }
}
