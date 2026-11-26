import { type Command, InvalidArgumentError } from 'commander';
import {
  AVAILABLE_BUILDERS,
  type BuilderVariant,
} from '../lib/configuration/index.js';
import { getRemainingFlags } from '../lib/utils/remaining-flags.js';
import { AbstractCommand } from './abstract.command.js';
import type { StartCommandContext } from './context/index.js';

export class StartCommand extends AbstractCommand {
  public load(program: Command): void {
    type StartCommandOptions = {
      config?: string;
      path?: string;
      watch?: boolean;
      builder?: BuilderVariant;
      watchAssets?: boolean;
      debug?: string | boolean;
      webpack?: boolean;
      webpackPath?: string;
      rspackPath?: string;
      typeCheck?: boolean;
      bundleDependencies?: boolean;
      emitDeclarations?: boolean;
      silent?: boolean;
      tsc?: boolean;
      sourceRoot?: string;
      entryFile?: string;
      exec: string;
      preserveWatchOutput?: boolean;
      shell: boolean;
      envFile: string[];
    };

    program
      .command('start [app]')
      .allowUnknownOption()
      // Unknown options are collected into `args`, which commander otherwise
      // rejects as excess arguments once an app name is also present.
      .allowExcessArguments()
      .option(
        '-c, --config <path>',
        'Path to nest-cli configuration file.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Config path cannot be empty.');
          return val;
        },
      )
      .option('-p, --path <path>', 'Path to tsconfig file.', (val: string) => {
        if (!val.trim())
          throw new InvalidArgumentError('Tsconfig path cannot be empty.');
        return val;
      })
      .option('-w, --watch', 'Run in watch mode (live-reload).')
      .option(
        '-b, --builder <name>',
        `Builder to be used (choices: ${AVAILABLE_BUILDERS.join(', ')}).`,
        (val: string) => {
          const builder = val.trim().toLowerCase() as BuilderVariant;
          if (!builder)
            throw new InvalidArgumentError('Builder cannot be empty.');
          if (!AVAILABLE_BUILDERS.includes(builder))
            throw new InvalidArgumentError(
              `Allowed choices are ${AVAILABLE_BUILDERS.map((val) => `'${val}'`).join(', ')}`,
            );
          return builder;
        },
      )
      .option('--watchAssets', 'Watch non-ts (e.g., .graphql) files mode.')
      .option(
        '-d, --debug [hostport]',
        'Run in debug mode (with --inspect flag).',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Debug host/port cannot be empty.');
          return val;
        },
      )
      .option(
        '--webpack',
        'Use webpack for compilation (deprecated option, use --builder instead).',
      )
      .option(
        '--webpackPath <path>',
        'Path to webpack configuration.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError(
              'Webpack configuration path cannot be empty.',
            );
          return val;
        },
      )
      .option(
        '--rspackPath <path>',
        'Path to rspack configuration.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError(
              'Rspack configuration path cannot be empty.',
            );
          return val;
        },
      )
      .option(
        '--type-check',
        'Enable type checking (when SWC or rspack is used).',
        () => true,
      )
      .option(
        '--no-type-check',
        'Disable type checking (when SWC is used).',
        () => false,
      )
      .option(
        '--bundle-dependencies',
        'Bundle node_modules into the output (when rspack is used).',
        () => true,
      )
      .option(
        '--no-bundle-dependencies',
        'Leave node_modules out of the output (when rspack is used).',
        () => false,
      )
      .option(
        '--emit-declarations',
        'Emit declaration files (.d.ts) when using SWC builder.',
      )
      .option('--silent', 'Suppress informational compiler logs.')
      .option('--tsc', 'Use typescript compiler for compilation.')
      .option(
        '--sourceRoot <sourceRoot>',
        'Points at the root of the source code for the single project in standard mode structures, or the default project in monorepo mode structures.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Source root cannot be empty.');
          return val;
        },
      )
      .option(
        '--entryFile <entryFile>',
        "Path to the entry file where this command will work with. Defaults to the one defined at your Nest's CLI config file.",
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Entry file cannot be empty.');
          return val;
        },
      )
      .option(
        '-e, --exec <binary>',
        'Binary to run (default: "node").',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Binary cannot be empty.');
          return val;
        },
      )
      .option(
        '--preserveWatchOutput',
        'Use "preserveWatchOutput" option when using tsc watch mode.',
      )
      .option(
        '--shell',
        "Spawn child processes within a shell (see node's child_process.spawn() method docs). Default: true.",
        true,
      )
      .option('--no-shell', 'Do not spawn child processes within a shell.')
      .option(
        '--env-file <path>',
        'Path to an env file (.env) to be loaded into the environment.',
        (val: string, previous: string[]) => {
          if (!val.trim())
            throw new InvalidArgumentError('Env file path cannot be empty.');
          return previous.concat([val]);
        },
        [],
      )
      .description('Run Nest application.')
      .action(
        async (app: string, options: StartCommandOptions, command: Command) => {
          const isWebpackEnabled = options.tsc ? false : options.webpack;

          const context: StartCommandContext = {
            app,
            config: options.config,
            webpack: isWebpackEnabled,
            watch: !!options.watch,
            watchAssets: !!options.watchAssets,
            path: options.path,
            webpackPath: options.webpackPath,
            rspackPath: options.rspackPath,
            builder: options.tsc ? 'tsc' : options.builder,
            typeCheck: options.typeCheck,
            bundleDependencies: options.bundleDependencies,
            // Left undefined when the flag is absent so `getValueOrDefault` can
            // still fall through to `compilerOptions.emitDeclarations`.
            emitDeclarations: options.emitDeclarations,
            silent: !!options.silent,
            // Left undefined when the flag is absent so `WatchCompiler` can
            // fall through to the tsconfig 'preserveWatchOutput' option.
            preserveWatchOutput:
              !!options.watch && !isWebpackEnabled
                ? options.preserveWatchOutput
                : false,
            debug: options.debug,
            exec: options.exec,
            sourceRoot: options.sourceRoot,
            entryFile: options.entryFile,
            shell: !!options.shell,
            envFile: options.envFile ?? [],
            extraFlags: getRemainingFlags(command),
          };

          try {
            await this.action.handle(context);
          } catch {
            process.exit(1);
          }
        },
      );
  }
}
