import { CommanderStatic } from 'commander';
import { getRemainingFlags } from '../lib/utils/remaining-flags';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class AddCommand extends AbstractCommand {
  public load(program: CommanderStatic): void {
    program
      .command('add <library> [args...]')
      .allowUnknownOption()
      .description('Add a library')
      .action(async (library: string) => {
        const inputs: Input[] = [];

        const flags = getRemainingFlags(program);
        inputs.push({ name: 'library', value: library });
        await this.action.handle(inputs, [], flags);
      });
  }
}
