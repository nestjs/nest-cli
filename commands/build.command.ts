import { Command, CommanderStatic } from 'commander';
import type { BuildAction } from '../actions';
import { ERROR_PREFIX, INFO_PREFIX } from '../lib/ui';
import { AbstractCommand } from './abstract.command';
import { CommandStorage } from './command-storage';

export class BuildCommand extends AbstractCommand<BuildAction> {
  public load(program: CommanderStatic): void {
    program
      .command('build [app]')
      .option('-c, --config [path]', 'Path to nest-cli configuration file.')
      .option('-p, --path [path]', 'Path to tsconfig file.')
      .option('-w, --watch', 'Run in watch mode (live-reload).')
      .option('-b, --builder [name]', 'Builder to be used (tsc, webpack, swc).')
      .option('--watchAssets', 'Watch non-ts (e.g., .graphql) files mode.')
      .option(
        '--webpack',
        'Use webpack for compilation (deprecated option, use --builder instead).',
      )
      .option('--type-check', 'Enable type checking (when SWC is used).')
      .option('--webpackPath [path]', 'Path to webpack configuration.')
      .option('--tsc', 'Use tsc for compilation.')
      .description('Build Nest application.')
      .action(async (app: string, command: Command) => {
        const commandOptions = new CommandStorage();

        commandOptions.add({
          name: 'config',
          value: command.config,
        });

        const isWebpackEnabled = command.tsc ? false : command.webpack;
        commandOptions.add({ name: 'webpack', value: isWebpackEnabled });
        commandOptions.add({ name: 'watch', value: !!command.watch });
        commandOptions.add({
          name: 'watchAssets',
          value: !!command.watchAssets,
        });
        commandOptions.add({
          name: 'path',
          value: command.path,
        });
        commandOptions.add({
          name: 'webpackPath',
          value: command.webpackPath,
        });

        const availableBuilders = ['tsc', 'webpack', 'swc'];
        if (command.builder && !availableBuilders.includes(command.builder)) {
          console.error(
            ERROR_PREFIX +
              ` Invalid builder option: ${
                command.builder
              }. Available builders: ${availableBuilders.join(', ')}`,
          );
          return;
        }
        commandOptions.add({
          name: 'builder',
          value: command.builder,
        });

        if (command.typeCheck && command.builder !== 'swc') {
          console.warn(
            INFO_PREFIX +
              ` "typeCheck" will not have any effect when "builder" is not "swc".`,
          );
        }
        commandOptions.add({
          name: 'typeCheck',
          value: command.typeCheck,
        });

        const inputs = new CommandStorage();
        inputs.add({ name: 'app', value: app });
        await this.action.handle(inputs, commandOptions);
      });
  }
}
