import { Command } from 'commander';
import { AbstractCommand } from './abstract.command.js';

export class InfoCommand extends AbstractCommand {
  public load(program: Command) {
    program
      .command('info')
      .alias('i')
      .description('Display Nest project details.')
      .action(async () => {
        await this.action.handle();
      });
  }
}
