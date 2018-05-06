import { AbstractCommand } from './abstract.command';

export class UpdateCommand extends AbstractCommand {
  public load(program: any) {
    program
      .command('update')
      .alias('u')
      .option('--force -f', 'Call for upgrading instead of updating.')
      .option('--tag -t [tag]', 'Call for upgrading to latest | beta | rc | next tag.')
      .action(this.action.handle);
  }
}