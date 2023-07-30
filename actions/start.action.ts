import * as chalk from 'chalk';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';
import * as killProcess from 'tree-kill';
import { CommandStorage } from '../commands';
import { getTscConfigPath } from '../lib/compiler/helpers/get-tsc-config.path';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default';
import {
  defaultConfiguration,
  defaultOutDir,
} from '../lib/configuration/defaults';
import { ERROR_PREFIX } from '../lib/ui';
import { treeKillSync as killProcessSync } from '../lib/utils/tree-kill';
import { BuildAction } from './build.action';

export class StartAction extends BuildAction {
  public async handle(
    commandInputs: CommandStorage,
    commandOptions: CommandStorage,
  ) {
    try {
      const configFileName = commandOptions.get<string>('config', true).value;
      const configuration = await this.loader.load(configFileName);
      const appName = commandInputs.get<string>('app', true).value;

      const pathToTsconfig = getTscConfigPath(
        configuration,
        commandOptions,
        appName,
      );

      const isWatchEnabled =
        commandOptions.get<boolean>('watch')?.value ?? false;
      const isWatchAssetsEnabled =
        commandOptions.get<boolean>('watchAssets')?.value ?? false;
      const debugFlag = commandOptions.get<boolean>('debug')?.value ?? false;
      const binaryToRun = getValueOrDefault(
        configuration,
        'exec',
        appName,
        'exec',
        commandOptions,
        defaultConfiguration.exec,
      );

      const { options: tsOptions } =
        this.tsConfigProvider.getByConfigFilename(pathToTsconfig);
      const outDir = tsOptions.outDir || defaultOutDir;
      const entryFile = getValueOrDefault(
        configuration,
        'entryFile',
        appName,
        'entryFile',
        commandOptions,
        defaultConfiguration.entryFile,
      );
      const sourceRoot = getValueOrDefault(
        configuration,
        'sourceRoot',
        appName,
        'sourceRoot',
        commandOptions,
        defaultConfiguration.sourceRoot,
      );
      const onSuccess = this.createOnSuccessHook(
        entryFile,
        sourceRoot,
        debugFlag,
        outDir,
        binaryToRun,
      );

      await this.runBuild(
        commandInputs,
        commandOptions,
        isWatchEnabled,
        isWatchAssetsEnabled,
        debugFlag,
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
    entryFile: string,
    sourceRoot: string,
    debugFlag: boolean | string | undefined,
    outDirName: string,
    binaryToRun: string,
  ) {
    let childProcessRef: any;
    process.on(
      'exit',
      () => childProcessRef && killProcessSync(childProcessRef.pid),
    );

    return () => {
      if (childProcessRef) {
        childProcessRef.removeAllListeners('exit');
        childProcessRef.on('exit', () => {
          childProcessRef = this.spawnChildProcess(
            entryFile,
            sourceRoot,
            debugFlag,
            outDirName,
            binaryToRun,
          );
          childProcessRef.on('exit', () => (childProcessRef = undefined));
        });

        childProcessRef.stdin && childProcessRef.stdin.pause();
        killProcess(childProcessRef.pid);
      } else {
        childProcessRef = this.spawnChildProcess(
          entryFile,
          sourceRoot,
          debugFlag,
          outDirName,
          binaryToRun,
        );
        childProcessRef.on('exit', (code: number) => {
          process.exitCode = code;
          childProcessRef = undefined;
        });
      }
    };
  }

  private spawnChildProcess(
    entryFile: string,
    sourceRoot: string,
    debug: boolean | string | undefined,
    outDirName: string,
    binaryToRun: string,
  ) {
    let outputFilePath = join(outDirName, sourceRoot, entryFile);
    if (!fs.existsSync(outputFilePath + '.js')) {
      outputFilePath = join(outDirName, entryFile);
    }

    let childProcessArgs: string[] = [];
    const argsStartIndex = process.argv.indexOf('--');
    if (argsStartIndex >= 0) {
      childProcessArgs = process.argv.slice(argsStartIndex + 1);
    }
    outputFilePath =
      outputFilePath.indexOf(' ') >= 0 ? `"${outputFilePath}"` : outputFilePath;

    const processArgs = [outputFilePath, ...childProcessArgs];
    if (debug) {
      const inspectFlag =
        typeof debug === 'string' ? `--inspect=${debug}` : '--inspect';
      processArgs.unshift(inspectFlag);
    }
    if (this.isSourceMapSupportPkgAvailable()) {
      processArgs.unshift('-r source-map-support/register');
    }
    return spawn(binaryToRun, processArgs, {
      stdio: 'inherit',
      shell: true,
    });
  }

  private isSourceMapSupportPkgAvailable() {
    try {
      require.resolve('source-map-support');
      return true;
    } catch {
      return false;
    }
  }
}
