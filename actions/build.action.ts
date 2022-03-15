import * as chalk from 'chalk';
import { join } from 'path';
import { CompilerOptions } from 'typescript';
import { Input } from '../commands';
import { AssetsManager } from '../lib/compiler/assets-manager';
import { Compiler } from '../lib/compiler/compiler';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default';
import { TsConfigProvider } from '../lib/compiler/helpers/tsconfig-provider';
import { PluginsLoader } from '../lib/compiler/plugins-loader';
import { TypeScriptBinaryLoader } from '../lib/compiler/typescript-loader';
import { WatchCompiler } from '../lib/compiler/watch-compiler';
import { WebpackCompiler } from '../lib/compiler/webpack-compiler';
import { WorkspaceUtils } from '../lib/compiler/workspace-utils';
import {
  ConfigurationLoader,
  NestConfigurationLoader
} from '../lib/configuration';
import { defaultOutDir } from '../lib/configuration/defaults';
import { FileSystemReader } from '../lib/readers';
import { ERROR_PREFIX } from '../lib/ui';
import { AbstractAction } from './abstract.action';
import webpack = require('webpack');

export class BuildAction extends AbstractAction {
  protected readonly pluginsLoader = new PluginsLoader();
  protected readonly tsLoader = new TypeScriptBinaryLoader();
  protected readonly tsConfigProvider = new TsConfigProvider(this.tsLoader);
  protected readonly compiler = new Compiler(
    this.pluginsLoader,
    this.tsConfigProvider,
    this.tsLoader,
  );
  protected readonly webpackCompiler = new WebpackCompiler(this.pluginsLoader);
  protected readonly watchCompiler = new WatchCompiler(
    this.pluginsLoader,
    this.tsConfigProvider,
    this.tsLoader,
  );
  protected readonly fileSystemReader = new FileSystemReader(process.cwd());
  protected readonly loader: ConfigurationLoader = new NestConfigurationLoader(
    this.fileSystemReader,
  );
  protected readonly assetsManager = new AssetsManager();
  protected readonly workspaceUtils = new WorkspaceUtils();

  public async handle(inputs: Input[], options: Input[]) {
    try {
      const watchModeOption = options.find((option) => option.name === 'watch');
      const watchMode = !!(watchModeOption && watchModeOption.value);

      const watchAssetsModeOption = options.find(
        (option) => option.name === 'watchAssets',
      );
      const watchAssetsMode = !!(
        watchAssetsModeOption && watchAssetsModeOption.value
      );

      await this.runBuild(inputs, options, watchMode, watchAssetsMode);
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
    inputs: Input[],
    options: Input[],
    watchMode: boolean,
    watchAssetsMode: boolean,
    isDebugEnabled = false,
    onSuccess?: () => void,
  ) {
    const configFileName = options.find((option) => option.name === 'config')!
      .value as string;
    const configuration = await this.loader.load(configFileName);
    const appName = inputs.find((input) => input.name === 'app')!
      .value as string;

    const pathToTsconfig = getValueOrDefault<string>(
      configuration,
      'compilerOptions.tsConfigPath',
      appName,
      'path',
      options,
    );
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
    await this.workspaceUtils.deleteOutDirIfEnabled(
      configuration,
      appName,
      outDir,
    );
    this.assetsManager.copyAssets(
      configuration,
      appName,
      outDir,
      watchAssetsMode,
    );

    if (isWebpackEnabled) {
      const webpackPath = getValueOrDefault<string>(
        configuration,
        'compilerOptions.webpackConfigPath',
        appName,
        'webpackPath',
        options,
      );

      const webpackConfigFactoryOrConfig = this.getWebpackConfigFactoryByPath(
        webpackPath,
        configuration.compilerOptions!.webpackConfigPath!,
      );
      return this.webpackCompiler.run(
        configuration,
        webpackConfigFactoryOrConfig,
        pathToTsconfig,
        appName,
        isDebugEnabled,
        watchMode,
        this.assetsManager,
        onSuccess,
      );
    }

    if (watchMode) {
      const tsCompilerOptions: CompilerOptions = {};
      const isPreserveWatchOutputEnabled = options.find(
        (option) =>
          option.name === 'preserveWatchOutput' && option.value === true,
      );
      if (isPreserveWatchOutputEnabled) {
        tsCompilerOptions.preserveWatchOutput = true;
      }
      this.watchCompiler.run(
        configuration,
        pathToTsconfig,
        appName,
        tsCompilerOptions,
        onSuccess,
      );
    } else {
      this.compiler.run(configuration, pathToTsconfig, appName, onSuccess);
      this.assetsManager.closeWatchers();
    }
  }

  private getWebpackConfigFactoryByPath(
    webpackPath: string,
    defaultPath: string,
  ): (
    config: webpack.Configuration,
    webpackRef: typeof webpack,
  ) => webpack.Configuration | webpack.Configuration {
    const pathToWebpackFile = join(process.cwd(), webpackPath);
    try {
      return require(pathToWebpackFile);
    } catch (err) {
      if (webpackPath !== defaultPath) {
        throw err;
      }
      return ({}) => ({});
    }
  }
}
