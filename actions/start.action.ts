import chalk from 'chalk';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';
import * as killProcess from 'tree-kill';
import { Input } from '../commands';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default';
import { Configuration } from '../lib/configuration';
import { defaultOutDir } from '../lib/configuration/defaults';
import { ERROR_PREFIX } from '../lib/ui';
import { BuildAction } from './build.action';

export class StartAction extends BuildAction {
  public async handle(inputs: Input[], options: Input[]) {
    try {
      const configuration = await this.loader.load();
      const appName = inputs.find(input => input.name === 'app')!
        .value as string;

      const pathToTsconfig = getValueOrDefault<string>(
        configuration,
        'compilerOptions.tsConfigPath',
        appName,
        'path',
        options,
      );

      const watchModeOption = options.find(option => option.name === 'watch');
      const debugModeOption = options.find(option => option.name === 'debug');
      const isWatchEnabled = !!(watchModeOption && watchModeOption.value);
      const isDebugEnabled = !!(debugModeOption && debugModeOption.value);

      const { options: tsOptions } = this.tsConfigProvider.getByConfigFilename(
        pathToTsconfig,
      );
      const outDir = tsOptions.outDir || defaultOutDir;
      const onSuccess = this.createOnSuccessHook(
        configuration,
        appName,
        isDebugEnabled,
        outDir,
      );

      await this.runBuild(
        inputs,
        options,
        isWatchEnabled,
        isDebugEnabled,
        onSuccess,
      );
    } catch (err) {
      if (err instanceof Error) {
        console.log(`\n${ERROR_PREFIX} ${err.message}\n`);
      } else {
        console.error(`\n${chalk.red(err)}\n`);
      }
    }
  }

  public createOnSuccessHook(
    configuration: Required<Configuration>,
    appName: string,
    isDebugEnabled: boolean,
    outDirName: string,
  ) {
    let childProcessRef: any;
    process.on(
      'exit',
      code => childProcessRef && killProcess(childProcessRef.pid),
    );

    return () => {
      if (childProcessRef) {
        childProcessRef.stdin.pause();
        killProcess(childProcessRef.pid);
      }
      const sourceRoot = getValueOrDefault(
        configuration,
        'sourceRoot',
        appName,
      );
      const entryFile = getValueOrDefault(configuration, 'entryFile', appName);

      let outputFilePath = join(outDirName, sourceRoot, entryFile);
      if (!fs.existsSync(outputFilePath + '.js')) {
        outputFilePath = join(outDirName, entryFile);
      }

      let childProcessArgs: string[] = [];
      const argsStartIndex = process.argv.indexOf('--');
      if (argsStartIndex >= 0) {
        childProcessArgs = process.argv.slice(argsStartIndex + 1);
      }
      const processArgs = [outputFilePath, ...childProcessArgs];
      if (isDebugEnabled) {
        processArgs.unshift('--inspect');
      }
      childProcessRef = spawn('node', processArgs, {
        stdio: 'inherit',
        shell: true,
      });
    };
  }
}
