import { Command, CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class UpdateCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('update')
      .alias('u')
      .description('Update Nest dependencies')
      .option('-f, --force', 'Call for upgrading instead of updating.')
      .option(
        '-t, --tag <tag>',
        'Call for upgrading to latest | beta | rc | next tag.',
      )
      .action(async (command: Command) => {
        const options: Input[] = [];
        options.push({ name: 'force', value: !!command.force });
        options.push({ name: 'tag', value: command.tag });
        await this.action.handle([], options);
      });
  }
}
