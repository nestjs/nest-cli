import { Command, CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class RemoveCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('remove [name]')
      .alias('r')
      .description('Remove a Nest application in monorepo.')
      .action(async (name: string) => {
        const inputs: Input[] = [{ name: 'name', value: name }];
        await this.action.handle(inputs);
      });
  }
}
