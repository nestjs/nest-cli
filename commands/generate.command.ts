import { bold, cyan, green } from 'ansis';
import Table from 'cli-table3';
import { Command } from 'commander';
import {
  AbstractCollection,
  CollectionFactory,
} from '../lib/schematics/index.js';
import { Schematic } from '../lib/schematics/nest.collection.js';
import { loadConfiguration } from '../lib/utils/load-configuration.js';
import { AbstractCommand } from './abstract.command.js';
import { GenerateCommandContext } from './context/index.js';

export class GenerateCommand extends AbstractCommand {
  public async load(program: Command): Promise<void> {
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
        { value: true, passedAsInput: false },
      )
      .option(
        '--spec-file-suffix [suffix]',
        'Use a custom suffix for spec files.',
      )
      .option('--skip-import', 'Skip importing', () => true, false)
      .option('--format', 'Format generated files using Prettier.', false)
      .option('--no-spec', 'Disable spec files generation.', () => {
        return { value: false, passedAsInput: true };
      })
      .option(
        '-c, --collection [collectionName]',
        'Schematics collection to use.',
      )
      .action(
        async (
          schematic: string,
          name: string,
          path: string,
          options: Record<string, any>,
        ) => {
          const context: GenerateCommandContext = {
            schematic,
            name,
            path,
            dryRun: !!options.dryRun,
            flat: options.flat,
            spec: options.spec,
            specFileSuffix: options.specFileSuffix,
            collection: options.collection,
            project: options.project,
            skipImport: options.skipImport,
            format: options.format === true,
          };

          await this.action.handle(context);
        },
      );
  }

  private async buildDescription(): Promise<string> {
    const collection = await this.getCollection();
    return (
      'Generate a Nest element.\n' +
      `  Schematics available on ${bold(collection)} collection:\n` +
      this.buildSchematicsListAsTable(await this.getSchematics(collection))
    );
  }

  private buildSchematicsListAsTable(schematics: Schematic[]): string {
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
    const table = new Table(tableConfig);
    for (const schematic of schematics) {
      table.push([
        green(schematic.name),
        cyan(schematic.alias),
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
