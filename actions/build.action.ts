import chalk from 'chalk';
import { join } from 'path';
import webpack = require('webpack');
import { Input } from '../commands';
import { Compiler } from '../lib/compiler/compiler';
import { TsConfigProvider } from '../lib/compiler/helpers/tsconfig-provider';
import { PluginsLoader } from '../lib/compiler/plugins-loader';
import { WatchCompiler } from '../lib/compiler/watch-compiler';
import { WebpackCompiler } from '../lib/compiler/webpack-compiler';
import {
  ConfigurationLoader,
  NestConfigurationLoader,
} from '../lib/configuration';
import { FileSystemReader } from '../lib/readers';
import { AbstractAction } from './abstract.action';

export class BuildAction extends AbstractAction {
  protected readonly pluginsLoader = new PluginsLoader();
  protected readonly tsConfigProvider = new TsConfigProvider();
  protected readonly compiler = new Compiler(
    this.pluginsLoader,
    this.tsConfigProvider,
  );
  protected readonly webpackCompiler = new WebpackCompiler(this.pluginsLoader);
  protected readonly watchCompiler = new WatchCompiler(this.pluginsLoader);
  protected readonly fileSystemReader = new FileSystemReader(process.cwd());
  protected readonly loader: ConfigurationLoader = new NestConfigurationLoader(
    this.fileSystemReader,
  );

  public async handle(inputs: Input[], options: Input[]) {
    try {
      const watchModeOption = options.find(option => option.name === 'watch');
      const watchMode = !!(watchModeOption && watchModeOption.value);
      await this.runBuild(options, watchMode);
    } catch (err) {
      console.error(chalk.red(err));
    }
  }

  public async runBuild(
    options: Input[],
    watchMode: boolean,
    onSuccess?: () => void,
  ) {
    const configuration = await this.loader.load();
    const pathToTsconfig =
      (options.find(option => option.name === 'path')!.value as string) ||
      configuration.compilerOptions!.tsConfigPath;
    const isWebpackEnabled =
      (options.find(option => option.name === 'webpack')!.value as boolean) ||
      configuration.compilerOptions!.webpack;

    if (isWebpackEnabled) {
      const webpackPath =
        (options.find(option => option.name === 'webpackPath')!
          .value as string) ||
        configuration.compilerOptions!.webpackConfigPath!;

      const webpackConfigFactoryOrConfig = this.getWebpackConfigFactoryByPath(
        webpackPath,
        configuration.compilerOptions!.webpackConfigPath!,
      );
      return this.webpackCompiler.run(
        configuration,
        webpackConfigFactoryOrConfig,
        pathToTsconfig!,
        watchMode,
        onSuccess,
      );
    }

    if (watchMode) {
      this.watchCompiler.run(configuration, pathToTsconfig!, onSuccess);
    } else {
      this.compiler.run(configuration, pathToTsconfig!, onSuccess);
    }
  }

  private getWebpackConfigFactoryByPath(
    webpackPath: string,
    defaultPath: string,
  ): (
    config: webpack.Configuration,
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
