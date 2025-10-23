'use strict';
import { AbstractCommand } from './abstract.command';
import { Command, CommanderStatic } from 'commander';
import { Input } from './command.input';

export class RemoveCommand extends AbstractCommand {
  public load(program: CommanderStatic): void {
    program
      .command('remove <schematicName>')
      .alias('rm')
      .description('Removes a schematic from your nest project')
      .action(async (schematicName: string, command: Command) => {
        const inputs: Input[] = [];

        inputs.push({ name: 'schematicName', value: schematicName });

        const options: Input[] = []

        await this.action.handle(inputs, options);
      });
  }
}

