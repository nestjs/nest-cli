import { AbstractCommand } from './abstract.command';

export class UpdateCommand extends AbstractCommand {
  public load(program: any) {
    program
      .command('update')
      .alias('u')
      .action(this.action.handle);
  }
}