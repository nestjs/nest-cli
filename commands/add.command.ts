import { CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';

export class AddCommand extends AbstractCommand {
  public load(program: CommanderStatic): void {
    program
      .command('add <library>')
      .description('Allow user to add a library')
      .action(async (library: string) => {
        console.log('add the library', library);
      });
  }
}
