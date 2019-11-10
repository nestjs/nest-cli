import { Command, CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class StartCommand extends AbstractCommand {
  public load(program: CommanderStatic): void {
    program
      .command('start [app]')
      .option('-p, --path [path]', 'Path to tsconfig file')
      .option('-w, --watch', 'Run in watch mode (live-reload)')
      .option(
        '-d, --debug [hostport] ',
        'Run in debug mode (with --inspect flag)',
      )
      .option('--webpack', 'Use webpack for compilation')
      .option('--webpackPath [path]', 'Path to webpack configuration')
      .option('--tsc', 'Use tsc for compilation')
      .description('Start Nest application')
      .action(async (app: string, command: Command) => {
        const options: Input[] = [];

        const isWebpackEnabled = command.tsc ? false : command.webpack;
        options.push({ name: 'webpack', value: isWebpackEnabled });
        options.push({ name: 'debug', value: command.debug });
        options.push({ name: 'watch', value: !!command.watch });
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
