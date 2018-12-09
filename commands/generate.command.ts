import { Command, CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';
import { NestCollection } from '../lib/schematics/nest.collection';
const Table = require('cli-table2');

export class GenerateCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('generate <schematic> <name> [path]')
      .alias('g')
      .description(this.buildDescription())
      .option('--dry-run', 'Allow to test changes before command execution')
      .option('--flat', 'Enforce flat structure of generated element')
      .option('--no-spec', 'Disable spec files generation')
      .action(
        async (
          schematic: string,
          name: string,
          path: string,
          command: Command,
        ) => {
          const options: Input[] = [];
          options.push({ name: 'dry-run', value: !!command.dryRun });
          options.push({ name: 'flat', value: command.flat });
          options.push({
            name: 'spec',
            value: command.spec,
          });

          const inputs: Input[] = [];
          inputs.push({ name: 'schematic', value: schematic });
          inputs.push({ name: 'name', value: name });
          inputs.push({ name: 'path', value: path });

          await this.action.handle(inputs, options);
        },
      );
  }

  private buildDescription(): string {
    let description = ''
      .concat('Generate a Nest element.\n\n')
      .concat('  Available schematics:\n')
      .concat(
        this.buildSchematicsListAsTable()
      );

    return description;
  }

  private buildSchematicsListAsTable(): string {
    // See https://github.com/jamestalmage/cli-table2 for documentation
    const leftMargin = ' '.repeat(4);
    const tableConfig = {
      head: ['name', 'alias'],
      chars: {
        'left': leftMargin.concat('│'),
        'top-left': leftMargin.concat('┌'),
        'bottom-left': leftMargin.concat('└'),
        'mid': '',
        'left-mid': '',
        'mid-mid': '',
        'right-mid': ''
      }
    };
    let table = new Table(tableConfig);

    for (let schematic of NestCollection.getSchematics()) {
      table.push([schematic.name, schematic.alias]);
    }

    return table.toString();
  }
}
