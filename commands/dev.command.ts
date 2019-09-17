import { Command, CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class DevCommand extends AbstractCommand {
  public load(program: CommanderStatic): void {
    program
      .command('dev')
      .option('-p, --path [path]', 'Path to tsconfig file')
      .option('--webpack', 'Use webpack for compilation')
      .option('--webpackPath [path]', 'Path to webpack configuration')
      .description('Build Nest application')
      .action(async (command: Command) => {
        const options: Input[] = [];

        options.push({ name: 'webpack', value: !!command.webpack });
        options.push({
          name: 'path',
          value: command.path,
        });
        options.push({
          name: 'webpackPath',
          value: command.webpackPath,
        });

        await this.action.handle([], options);
      });
  }
}
