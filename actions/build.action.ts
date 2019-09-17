import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';
import { Input } from '../commands';
import { Compiler } from '../lib/compiler/compiler';
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
  protected readonly compiler = new Compiler(this.pluginsLoader);
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

      const pathToWebpackFile = join(process.cwd(), webpackPath);
      if (!existsSync(pathToWebpackFile)) {
        throw new Error(
          `Could not find webpack configuration file "${pathToWebpackFile}".`,
        );
      }
      return this.webpackCompiler.run(
        configuration,
        require(pathToWebpackFile),
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
}
