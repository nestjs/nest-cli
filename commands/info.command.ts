import { AbstractCommand } from './abstract.command';
import { CommanderStatic } from 'commander';

export class InfoCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('info')
      .alias('i')
      .description('Display Nest CLI details')
      .action(async () => {
        await this.action.handle();
      });
  }
}
