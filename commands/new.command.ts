import { AbstractCommand } from './abstract.command';
import { CommanderStatic } from 'commander';

export class NewCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('new [name] [description] [version] [author]')
      .alias('n')
      // .argument('', 'The Nest application name.')
      // .argument('', 'The Nest application description.')
      // .argument('', 'The Nest application version.')
      // .argument('', 'The Nest application author.')
      .option('--dry-run', 'allow to test changes before execute command.')
      .action(this.action.handle);
  }
}
