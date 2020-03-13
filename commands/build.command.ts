import { Command, CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class BuildCommand extends AbstractCommand {
  public load(program: CommanderStatic): void {
    program
      .command('build [app]')
      .option('-c, --config [path]', 'Path to nest-cli configuration file.')
      .option('-p, --path [path]', 'Path to tsconfig file.')
      .option('-w, --watch', 'Run in watch mode (live-reload).')
      .option('--watchAssets', 'Watch non-ts (e.g., .graphql) files mode.')
      .option('--webpack', 'Use webpack for compilation.')
      .option('--webpackPath [path]', 'Path to webpack configuration.')
      .option('--tsc', 'Use tsc for compilation.')
      .description('Build Nest application.')
      .action(async (app: string, command: Command) => {
        const options: Input[] = [];

        options.push({
          name: 'config',
          value: command.config,
        });

        const isWebpackEnabled = command.tsc ? false : command.webpack;
        options.push({ name: 'webpack', value: isWebpackEnabled });
        options.push({ name: 'watch', value: !!command.watch });
        options.push({ name: 'watchAssets', value: !!command.watchAssets });
        options.push({
          name: 'path',
          value: command.path,
        });
        options.push({
          name: 'webpackPath',
          value: command.webpackPath,
        });

        const inputs: Input[] = [];
        inputs.push({ name: 'app', value: app });
        await this.action.handle(inputs, options);
      });
  }
}
