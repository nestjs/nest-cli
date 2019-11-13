import { Command, CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class TestCommand extends AbstractCommand {
  public load(program: CommanderStatic): void {
    program
      .command('test [app]')
      .option('-p, --path [path]', 'Path to tsconfig file')
      .option('-c, --config', 'Using jest configuration file')
      .option(
        '-d, --debug [hostport] ',
        'Run in debug mode (with --inspect flag)',
      )
      .option('--tsc', 'Use tsc for compilation')
      .description('Test Nest application')
      .action(async (app: string, command: Command) => {
        const options: Input[] = [];

        options.push({ name: 'debug', value: command.debug });
        options.push({ name: 'config', value: !!command.config });
        options.push({ name: 'path', value: command.path });

        const inputs: Input[] = [];
        inputs.push({ name: 'app', value: app });
        await this.action.handle(inputs, options);
      });
  }
}
