import { Command } from 'commander';
import { ERROR_PREFIX } from '../lib/ui/index.js';
import { AbstractCommand } from './abstract.command.js';
import { BuildCommandContext } from './context/index.js';

export class BuildCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command('build [apps...]')
      .option('-c, --config [path]', 'Path to nest-cli configuration file.')
      .option('-p, --path [path]', 'Path to tsconfig file.')
      .option('-w, --watch', 'Run in watch mode (live-reload).')
      .option(
        '-b, --builder [name]',
        'Builder to be used (tsc, webpack, swc, rspack).',
      )
      .option('--watchAssets', 'Watch non-ts (e.g., .graphql) files mode.')
      .option(
        '--webpack',
        'Use webpack for compilation (deprecated option, use --builder instead).',
      )
      .option('--type-check', 'Enable type checking (when SWC is used).')
      .option('--silent', 'Suppress informational compiler logs.')
      .option('--webpackPath [path]', 'Path to webpack configuration.')
      .option('--tsc', 'Use typescript compiler for compilation.')
      .option(
        '--preserveWatchOutput',
        'Use "preserveWatchOutput" option when using tsc watch mode.',
      )
      .option('--all', 'Build all projects in a monorepo.')
      .description('Build Nest application.')
      .action(async (apps: string[], options: Record<string, any>) => {
        const isWebpackEnabled = options.tsc ? false : options.webpack;

        const availableBuilders = ['tsc', 'webpack', 'swc', 'rspack'];
        if (options.builder && !availableBuilders.includes(options.builder)) {
          console.error(
            ERROR_PREFIX +
              ` Invalid builder option: ${
                options.builder
              }. Available builders: ${availableBuilders.join(', ')}`,
          );
          return;
        }

        const context: BuildCommandContext = {
          apps: apps.length > 0 ? apps : [],
          config: options.config,
          webpack: isWebpackEnabled,
          watch: !!options.watch,
          watchAssets: !!options.watchAssets,
          path: options.path,
          webpackPath: options.webpackPath,
          builder: options.builder,
          typeCheck: options.typeCheck,
          silent: !!options.silent,
          preserveWatchOutput:
            !!options.preserveWatchOutput &&
            !!options.watch &&
            !isWebpackEnabled,
          all: !!options.all,
        };

        await this.action.handle(context);
      });
  }
}
