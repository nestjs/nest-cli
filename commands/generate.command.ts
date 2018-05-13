import { AbstractCommand } from './abstract.command';
import { CommanderStatic, Command } from 'commander';
import { Input } from './command.input';
import { parse } from '../lib/inputs/parse';

export class GenerateCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('generate <schematic> <name> [path]')
      .alias('g')
      .description('Generate a Nest element.')
      // .argument('<schematic>', 'Nest framework asset type')
      // .argument('<name>', 'Asset name or path')
      // .argument('[path]', 'Path to generate the asset')
      .option('--dry-run', 'Allow to test changes before execute command')
      .action(async (schematic: string, name: string, path: string, command: Command) => {
        const options: Input[] = [];
        options.push(parse('dry-run')(command[ 'dryRun' ] !== undefined ? command[ 'dryRun' ] : false));
        const inputs: Input[] = [];
        inputs.push(parse('schematic')(schematic));
        inputs.push(parse('name')(name));
        inputs.push(parse('path')(path));
        await this.action.handle(inputs, options);
      });
  }
}
