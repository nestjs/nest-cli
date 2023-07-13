import * as chalk from 'chalk';
import * as Table from 'cli-table3';
import { Command, CommanderStatic } from 'commander';
import { AbstractCollection, CollectionFactory } from '../lib/schematics';
import { Schematic } from '../lib/schematics/nest.collection';
import { loadConfiguration } from '../lib/utils/load-configuration';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class GenerateCommand extends AbstractCommand {
  public async load(program: CommanderStatic): Promise<void> {
    program
      .command('generate <schematic> [name] [path]')
      .alias('g')
      .description(await this.buildDescription())
      .option(
        '-d, --dry-run',
        'Report actions that would be taken without writing out results.',
      )
      .option('-p, --project [project]', 'Project in which to generate files.')
      .option(
        '--flat',
        'Enforce flat structure of generated element.',
        () => true,
      )
      .option(
        '--no-flat',
        'Enforce that directories are generated.',
        () => false,
      )
      .option(
        '--spec',
        'Enforce spec files generation.',
        () => {
          return { value: true, passedAsInput: true };
        },
        true,
      )
      .option(
        '--spec-file-suffix [suffix]',
        'Use a custom suffix for spec files.',
      )
      .option('--skip-import', 'Skip importing', () => true, false)
      .option('--no-spec', 'Disable spec files generation.', () => {
        return { value: false, passedAsInput: true };
      })
      .option(
        '-c, --collection [collectionName]',
        'Schematics collection to use.',
      )
      .option(
      '--fileNameCase [fileNameCase]',
      'File name case.',
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

          if (command.flat !== undefined) {
            options.push({ name: 'flat', value: command.flat });
          }

          options.push({
            name: 'spec',
            value:
              typeof command.spec === 'boolean'
                ? command.spec
                : command.spec.value,
            options: {
              passedAsInput:
                typeof command.spec === 'boolean'
                  ? false
                  : command.spec.passedAsInput,
            },
          });
          options.push({
            name: 'specFileSuffix',
            value: command.specFileSuffix,
          });
          options.push({
            name: 'collection',
            value: command.collection,
          });
          options.push({
            name: 'project',
            value: command.project,
          });

          options.push({
            name: 'skipImport',
            value: command.skipImport,
          });

          options.push({
            name: 'fileNameCase',
            value: command.fileNameCase,
          });

          console.log({ options })

          const inputs: Input[] = [];
          inputs.push({ name: 'schematic', value: schematic });
          inputs.push({ name: 'name', value: name });
          inputs.push({ name: 'path', value: path });

          await this.action.handle(inputs, options);
        },
      );
  }

  private async buildDescription(): Promise<string> {
    const collection = await this.getCollection();
    return (
      'Generate a Nest element.\n' +
      `  Schematics available on ${chalk.bold(collection)} collection:\n` +
      this.buildSchematicsListAsTable(await this.getSchematics(collection))
    );
  }

  private buildSchematicsListAsTable(schematics: Schematic[]): Promise<string> {
    const leftMargin = '    ';
    const tableConfig = {
      head: ['name', 'alias', 'description'],
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
    for (const schematic of schematics) {
      table.push([
        chalk.green(schematic.name),
        chalk.cyan(schematic.alias),
        schematic.description,
      ]);
    }
    return table.toString();
  }

  private async getCollection(): Promise<string> {
    const configuration = await loadConfiguration();
    return configuration.collection;
  }

  private async getSchematics(collection: string): Promise<Schematic[]> {
    const abstractCollection: AbstractCollection =
      CollectionFactory.create(collection);
    return abstractCollection.getSchematics();
  }
}
