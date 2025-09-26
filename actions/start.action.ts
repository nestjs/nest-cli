import { red } from 'ansis';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';
import { Input } from '../commands';
import { getTscConfigPath } from '../lib/compiler/helpers/get-tsc-config.path';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default';
import {
  defaultConfiguration,
  defaultOutDir,
} from '../lib/configuration/defaults';
import { ERROR_PREFIX } from '../lib/ui';
import { treeKillSync as killProcessSync } from '../lib/utils/tree-kill';
import { BuildAction } from './build.action';
import { assertNonArray } from '../lib/utils/type-assertions';

export class StartAction extends BuildAction {
  public async handle(commandInputs: Input[], commandOptions: Input[]) {
    try {
      const configFileName = commandOptions.find(
        (option) => option.name === 'config',
      )!.value as string;
      const configuration = await this.loader.load(configFileName);
      const appName = commandInputs.find((input) => input.name === 'app')!
        .value as string;

      const pathToTsconfig = getTscConfigPath(
        configuration,
        commandOptions,
        appName,
      );

      const debugModeOption = commandOptions.find(
        (option) => option.name === 'debug',
      );
      const watchModeOption = commandOptions.find(
        (option) => option.name === 'watch',
      );
      const isWatchEnabled = !!(watchModeOption && watchModeOption.value);
      const watchAssetsModeOption = commandOptions.find(
        (option) => option.name === 'watchAssets',
      );
      const isWatchAssetsEnabled = !!(
        watchAssetsModeOption && watchAssetsModeOption.value
      );
      const debugFlag = debugModeOption && debugModeOption.value;
      assertNonArray(debugFlag);

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

      const shellOption = commandOptions.find(
        (option) => option.name === 'shell',
      );
      const useShell = !!shellOption?.value;

      const envFileOption = commandOptions.find(
        (option) => option.name === 'envFile',
      );
      const envFile = (envFileOption?.value ?? []) as string[];

      const onSuccess = this.createOnSuccessHook(
        entryFile,
        sourceRoot,
        debugFlag,
        outDir,
        binaryToRun,
        {
          shell: useShell,
          envFile,
        },
      );

      await this.runBuild(
        commandInputs,
        commandOptions,
        isWatchEnabled,
        isWatchAssetsEnabled,
        !!debugFlag,
        onSuccess,
      );
    } catch (err) {
      if (err instanceof Error) {
        console.log(`\n${ERROR_PREFIX} ${err.message}\n`);
      } else {
        console.error(`\n${red(err)}\n`);
      }
    }
  }

  public createOnSuccessHook(
    entryFile: string,
    sourceRoot: string,
    debugFlag: boolean | string | undefined,
    outDirName: string,
    binaryToRun: string,
    options: {
      shell: boolean;
      envFile?: string[];
    },
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
            {
              shell: options.shell,
              envFile: options.envFile,
            },
          );
          childProcessRef.on('exit', () => (childProcessRef = undefined));
        });

        childProcessRef.stdin && childProcessRef.stdin.pause();
        killProcessSync(childProcessRef.pid);
      } else {
        childProcessRef = this.spawnChildProcess(
          entryFile,
          sourceRoot,
          debugFlag,
          outDirName,
          binaryToRun,
          {
            shell: options.shell,
            envFile: options.envFile,
          },
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
    options: {
      shell: boolean;
      envFile?: string[];
    },
  ) {
    let outputFilePath = join(outDirName, sourceRoot, entryFile);
    if (!fs.existsSync(outputFilePath + '.js')) {
      outputFilePath = join(outDirName, entryFile);
    }

    let childProcessArgs: string[] = [];
    const argsStartIndex = process.argv.indexOf('--');
    if (argsStartIndex >= 0) {
      // Prevents the need for users to double escape strings
      // i.e. I can run the more natural
      //   nest start -- '{"foo": "bar"}'
      // instead of
      //   nest start -- '\'{"foo": "bar"}\''
      childProcessArgs = process.argv
        .slice(argsStartIndex + 1)
        .map((arg) => JSON.stringify(arg));
    }
    outputFilePath =
      outputFilePath.indexOf(' ') >= 0 ? `"${outputFilePath}"` : outputFilePath;

    const processArgs = [outputFilePath, ...childProcessArgs];
    if (debug) {
      const inspectFlag =
        typeof debug === 'string' ? `--inspect=${debug}` : '--inspect';
      processArgs.unshift(inspectFlag);
    }

    if (options.envFile && options.envFile.length > 0) {
      const envFileNodeArgs = options.envFile.map(
        (envFilePath) => `--env-file=${envFilePath}`,
      );
      processArgs.unshift(envFileNodeArgs.join(' '));
    }

    processArgs.unshift('--enable-source-maps');

    return spawn(binaryToRun, processArgs, {
      stdio: 'inherit',
      shell: options.shell,
    });
  }
}
