import { CommanderStatic } from 'commander';
import type { InfoAction } from '../actions';
import { AbstractCommand } from './abstract.command';

export class InfoCommand extends AbstractCommand<InfoAction> {
  public load(program: CommanderStatic) {
    program
      .command('info')
      .alias('i')
      .description('Display Nest project details.')
      .action(async () => {
        await this.action.handle();
      });
  }
}
