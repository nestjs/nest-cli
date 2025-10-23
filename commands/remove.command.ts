'use strict';
import { AbstractCommand } from './abstract.command';
import { Command, CommanderStatic } from 'commander';
import { Input } from './command.input';

export class RemoveCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('remove <name>')
      .alias('rm')
      .description('Removes a Nest Element from your nest project')
      .action(async (name: string, command: Command) => {
        const inputs: Input[] = [];

        inputs.push({ name: 'name', value: name });

        const options: Input[] = []

        await this.action.handle(inputs, options);
      });
  }
}

