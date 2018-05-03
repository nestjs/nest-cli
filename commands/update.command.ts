import { AbstractCommand } from './abstract.command';

export class UpdateCommand extends AbstractCommand {
  public load(program: any) {
    program
      .command('update')
      .alias('u')
      .option('--force', 'Call for upgrading instead of updating.')
      .option('--tag [tag]', 'Call for upgrading to latest | beta | rc | next tag.')
      .action(this.action.handle);
  }
}