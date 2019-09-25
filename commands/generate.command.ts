import * as Table from 'cli-table3';
import { Command, CommanderStatic } from 'commander';
import { Collection } from '../lib/schematics';
import { NestCollection } from '../lib/schematics/nest.collection';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class GenerateCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('generate <schematic> [name] [path]')
      .alias('g')
      .description(this.buildDescription())
      .option('--dry-run', 'Allow to test changes before command execution')
      .option('-p, --project [project]', 'Project in which to generate files')
      .option('--flat', 'Enforce flat structure of generated element')
      .option('--no-spec', 'Disable spec files generation')
      .option(
        '-c, --collection [collectionName]',
        'Collection that shall be used',
      )
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
          options.push({
            name: 'collection',
            value: command.collection || Collection.NESTJS,
          });
          options.push({
            name: 'project',
            value: command.project,
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
    return (
      'Generate a Nest element\n' +
      '  Available schematics:\n' +
      this.buildSchematicsListAsTable()
    );
  }

  private buildSchematicsListAsTable(): string {
    const leftMargin = '    ';
    const tableConfig = {
      head: ['name', 'alias'],
      chars: {
        'left': leftMargin.concat('│'),
        'top-left': leftMargin.concat('┌'),
        'bottom-left': leftMargin.concat('└'),
        'mid': '',
        'left-mid': '',
        'mid-mid': '',
        'right-mid': '',
      },
    };
    const table: any = new Table(tableConfig);
    for (const schematic of NestCollection.getSchematics()) {
      table.push([schematic.name, schematic.alias]);
    }
    return table.toString();
  }
}
