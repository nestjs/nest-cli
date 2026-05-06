import { Command } from 'commander';
import { ERROR_PREFIX } from '../lib/ui/index.js';
import { getRemainingFlags } from '../lib/utils/remaining-flags.js';
import { AbstractCommand } from './abstract.command.js';
import { StartCommandContext } from './context/index.js';

export class StartCommand extends AbstractCommand {
  public load(program: Command): void {
    const collect = (value: any, previous: any) => {
      return previous.concat([value]);
    };

    program
      .command('start [app]')
      .allowUnknownOption()
      .option('-c, --config [path]', 'Path to nest-cli configuration file.')
      .option('-p, --path [path]', 'Path to tsconfig file.')
      .option('-w, --watch', 'Run in watch mode (live-reload).')
      .option(
        '-b, --builder [name]',
        'Builder to be used (tsc, webpack, swc, rspack).',
      )
      .option('--watchAssets', 'Watch non-ts (e.g., .graphql) files mode.')
      .option(
        '-d, --debug [hostport] ',
        'Run in debug mode (with --inspect flag).',
      )
      .option(
        '--webpack',
        'Use webpack for compilation (deprecated option, use --builder instead).',
      )
      .option('--webpackPath [path]', 'Path to webpack configuration.')
      .option('--rspackPath [path]', 'Path to rspack configuration.')
      .option(
        '--type-check',
        'Enable type checking (when SWC is used).',
        () => true,
      )
      .option(
        '--no-type-check',
        'Disable type checking (when SWC is used).',
        () => false,
      )
      .option(
        '--emit-declarations',
        'Emit declaration files (.d.ts) when using SWC builder.',
      )
      .option('--silent', 'Suppress informational compiler logs.')
      .option('--tsc', 'Use typescript compiler for compilation.')
      .option(
        '--sourceRoot [sourceRoot]',
        'Points at the root of the source code for the single project in standard mode structures, or the default project in monorepo mode structures.',
      )
      .option(
        '--entryFile [entryFile]',
        "Path to the entry file where this command will work with. Defaults to the one defined at your Nest's CLI config file.",
      )
      .option('-e, --exec [binary]', 'Binary to run (default: "node").')
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
        '--env-file [path]',
        'Path to an env file (.env) to be loaded into the environment.',
        collect,
        [],
      )
      .description('Run Nest application.')
      .action(async (app: string, options: Record<string, any>) => {
        const isWebpackEnabled = options.tsc ? false : options.webpack;

        const availableBuilders = ['tsc', 'webpack', 'swc', 'rspack'];
        if (options.builder && !availableBuilders.includes(options.builder)) {
          console.error(
            ERROR_PREFIX +
              ` Invalid builder option: ${
                options.builder
              }. Available builders: ${availableBuilders.join(', ')}`,
          );
          process.exit(1);
        }

        const context: StartCommandContext = {
          app,
          config: options.config,
          webpack: isWebpackEnabled,
          watch: !!options.watch,
          watchAssets: !!options.watchAssets,
          path: options.path,
          webpackPath: options.webpackPath,
          rspackPath: options.rspackPath,
          builder: options.builder,
          typeCheck: options.typeCheck,
          emitDeclarations: !!options.emitDeclarations,
          silent: !!options.silent,
          preserveWatchOutput:
            !!options.preserveWatchOutput &&
            !!options.watch &&
            !isWebpackEnabled,
          debug: options.debug,
          exec: options.exec,
          sourceRoot: options.sourceRoot,
          entryFile: options.entryFile,
          shell: !!options.shell,
          envFile: options.envFile ?? [],
          extraFlags: getRemainingFlags(program),
        };

        try {
          await this.action.handle(context);
        } catch {
          process.exit(1);
        }
      });
  }
}
