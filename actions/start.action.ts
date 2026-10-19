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
import { ERROR_PREFIX, INFO_PREFIX } from '../lib/ui/index.js';
import { treeKillSync as killProcessSync } from '../lib/utils/tree-kill.js';
import { assertNonArray } from '../lib/utils/type-assertions.js';
import { BuildAction } from './build.action.js';

/** Env files already reported missing, so watch-mode restarts say it once. */
const reportedMissingEnvFiles = new Set<string>();

/**
 * Whether an `--env-file` can be handed to Node. Node exits on a missing one,
 * and `.env` is git-ignored: a project whose start script loads it would not
 * start at all on a fresh clone or in CI, where the variables come from the
 * environment instead. So a missing file is skipped, with a notice.
 */
const envFileExists = (envFilePath: string): boolean => {
  if (fs.existsSync(envFilePath)) {
    return true;
  }
  if (!reportedMissingEnvFiles.has(envFilePath)) {
    reportedMissingEnvFiles.add(envFilePath);
    console.info(
      `${INFO_PREFIX} ${envFilePath} not found - starting without it.`,
    );
  }
  return false;
};

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
          watch: isWatchEnabled,
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
      // A failed build (e.g. SWC type-check errors, which now reject instead of
      // exiting the process themselves) must not report success to the caller.
      process.exit(1);
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
      watch?: boolean;
    },
  ) {
    let childProcessRef: ChildProcess | undefined;
    let shuttingDown = false;
    process.on(
      'exit',
      () => childProcessRef && killProcessSync(childProcessRef.pid!),
    );

    const signalHandler = (signal: NodeJS.Signals) => {
      shuttingDown = true;
      if (childProcessRef) {
        // Forward the signal to the child so async shutdown hooks
        // (onModuleDestroy, beforeApplicationShutdown, onApplicationShutdown)
        // can run to completion. The CLI parent will exit when the child
        // exits, see the child's exit handler below.
        childProcessRef.kill(signal);
      } else {
        process.exit();
      }
    };
    process.on('SIGINT', signalHandler);
    process.on('SIGTERM', signalHandler);

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
          childProcessRef.on('exit', (code, signal) => {
            childProcessRef = undefined;
            // Exit explicitly when shutting down; in watch/cluster mode the
            // file watcher keeps the event loop alive and would otherwise
            // require a second Ctrl+C to exit.
            if (shuttingDown) {
              process.exit(code ?? 0);
            } else if (options.watch) {
              this.reportAppExit(code, signal);
            }
          });
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
        childProcessRef.on('exit', (code, signal) => {
          process.exitCode = code;
          childProcessRef = undefined;
          // Exit explicitly when shutting down; in watch/cluster mode the
          // file watcher keeps the event loop alive and would otherwise
          // require a second Ctrl+C to exit.
          if (shuttingDown) {
            process.exit(code ?? 0);
          } else if (options.watch) {
            this.reportAppExit(code, signal);
          }
        });
      }
    };
  }

  /**
   * In watch mode the file watcher keeps the CLI running after the application
   * exits on its own, so without this line an app that exited before printing
   * anything looks exactly like one that is still starting.
   */
  private reportAppExit(code: number | null, signal: NodeJS.Signals | null) {
    const reason = signal
      ? `was terminated by ${signal}`
      : `exited with code ${code}`;
    const message = `The application ${reason}. Waiting for file changes before restarting...`;
    if (code === 0) {
      console.log(`\n${INFO_PREFIX} ${message}\n`);
    } else {
      console.error(`\n${ERROR_PREFIX} ${message}\n`);
    }
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
      const envFileNodeArgs = options.envFile
        .filter(envFileExists)
        .map((envFilePath) => `--env-file=${envFilePath}`);
      processArgs.unshift(...envFileNodeArgs);
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
