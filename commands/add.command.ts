import { CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class AddCommand extends AbstractCommand {
  public load(program: CommanderStatic): void {
    program
      .command('add <library>')
      .description('Allow user to add a library')
      .action(async (library: string) => {
        const inputs: Input[] = [];
        inputs.push({ name: 'library', value: library });
        await this.action.handle(inputs);
      });
  }
}
