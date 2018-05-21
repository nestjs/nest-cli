import { Command, CommanderStatic } from 'commander';
import { parse } from '../lib/inputs/parse';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class NewCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('new [name] [description] [version] [author]')
      .alias('n')
      .description('Generate a new Nest application.')
      .option('--dry-run', 'Allow to test changes before execute command.')
      .option('--skip-install', 'Allow to skip package installation.')
      .action(async (name: string, description: string, version: string, author: string, command: Command) => {
        const options: Input[] = [];
        options.push(parse('dry-run')(command.dryRun !== undefined ? command.dryRun : false));
        options.push(parse('skip-install')(command['skip-install'] !== undefined ? command['skip-install'] : false));
        const inputs: Input[] = [];
        inputs.push(parse('name')(name));
        inputs.push(parse('description')(description));
        inputs.push(parse('version')(version));
        inputs.push(parse('author')(author));
        await this.action.handle(inputs, options);
      });
  }
}
