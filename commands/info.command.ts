import { Command, CommanderStatic } from 'commander';
import { exitIfExtraArgs } from '../lib/utils/extra-args-warning';
import { AbstractCommand } from './abstract.command';

export class InfoCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('info')
      .alias('i')
      .description('Display Nest project details.')
      .action(async (command: Command) => {
        exitIfExtraArgs(command, 0);

        await this.action.handle();
      });
  }
}
