import { red } from 'ansis';
import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs';
import { join } from 'path';
import { StartCommandContext } from '../commands/index.js';
import { getTscConfigPath } from '../lib/compiler/helpers/get-tsc-config.path.js';
import { getValueOrDefault } from '../lib/compiler/helpers/get-value-or-default.js';
import {
  defaultConfiguration,
  defaultOutDir,
} from '../lib/configuration/defaults.js';
import { ERROR_PREFIX } from '../lib/ui/index.js';
import { treeKillSync as killProcessSync } from '../lib/utils/tree-kill.js';
import { assertNonArray } from '../lib/utils/type-assertions.js';
import { BuildAction } from './build.action.js';

export class StartAction extends BuildAction {
  public async handle(context: StartCommandContext) {
    try {
      const configFileName = context.config;
      const configuration = await this.loader.load(configFileName);
      const appName = context.app;

      const pathToTsconfig = getTscConfigPath(configuration, context, appName);

      const isWatchEnabled = !!context.watch;
      const isWatchAssetsEnabled = !!context.watchAssets;
      const debugFlag = context.debug;
      assertNonArray(debugFlag);

      const binaryToRun = getValueOrDefault(
        configuration,
        'exec',
        appName,
        'exec',
        context,
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
        context,
        defaultConfiguration.entryFile,
      );
      const sourceRoot = getValueOrDefault(
        configuration,
        'sourceRoot',
        appName,
        'sourceRoot',
        context,
        defaultConfiguration.sourceRoot,
      );

      const useShell = !!context.shell;
      const envFile = context.envFile ?? [];

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
        appName ? [appName] : [],
        context,
        isWatchEnabled,
        isWatchAssetsEnabled,
        !!debugFlag,
        onSuccess,
      );
    } catch (err) {
      if (err instanceof Error) {
        console.error(`\n${ERROR_PREFIX} ${err.message}\n`);
      } else {
        console.error(`\n${red(err)}\n`);
      }
    }
  }

  private createOnSuccessHook(
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
    let childProcessRef: ChildProcess | undefined;
    process.on(
      'exit',
      () => childProcessRef && killProcessSync(childProcessRef.pid!),
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

        (childProcessRef.stdin as NodeJS.ReadableStream | null)?.pause?.();
        killProcessSync(childProcessRef.pid!);
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

    const spawnOptions: SpawnOptions = {
      stdio: 'inherit',
      shell: options.shell,
    };

    if (options.shell) {
      const command = [binaryToRun, ...processArgs].join(' ');
      return spawn(command, spawnOptions);
    }

    return spawn(binaryToRun, processArgs, spawnOptions);
  }
}
