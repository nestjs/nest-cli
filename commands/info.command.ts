import { AbstractCommand } from './abstract.command';

export class InfoCommand extends AbstractCommand {
  public load(program: any) {
    program
      .command('info', 'Display Nest CLI details')
      .alias('i')
      .action(this.action.handle);
  }
}
