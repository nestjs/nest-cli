import { bold, cyan, green } from 'ansis';
import Table, { type TableConstructorOptions } from 'cli-table3';
import { type Command, InvalidArgumentError } from 'commander';
import type { Schematic } from '../lib/schematics/nest.collection.js';
import { disablePrompts } from '../lib/utils/is-interactive.js';
import { loadConfiguration } from '../lib/utils/load-configuration.js';
import { AbstractCommand } from './abstract.command.js';
import type { GenerateCommandContext } from './context/index.js';

export class GenerateCommand extends AbstractCommand {
  public async load(program: Command): Promise<void> {
    type GenerateCommandOptions = {
      dryRun?: boolean;
      project?: string;
      interactive?: false;
      flat?: boolean;
      spec: { value: boolean; passedAsInput: boolean };
      specFileSuffix?: string;
      skipImport: boolean;
      format: boolean;
      collection?: string;
      type?: string;
      crud?: boolean;
      prefix?: string;
    };

    program
      .command('generate <schematic> [name] [path]')
      .alias('g')
      .description(
        isHelpRequested()
          ? await this.buildDescription()
          : 'Generate a Nest element.',
      )
      .option(
        '-d, --dry-run',
        'Report actions that would be taken without writing out results.',
      )
      .option(
        '-p, --project <project>',
        'Project in which to generate files.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Project cannot be empty.');

          return val;
        },
      )
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
        '--spec-file-suffix <suffix>',
        'Use a custom suffix for spec files.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Spec file suffix cannot be empty.');

          return val;
        },
      )
      .option('--skip-import', 'Skip importing', () => true, false)
      .option('--format', 'Format generated files using Prettier.', false)
      .option('--no-spec', 'Disable spec files generation.', () => {
        return { value: false, passedAsInput: true };
      })
      .option(
        '-c, --collection <collectionName>',
        'Schematics collection to use.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Collection cannot be empty.');

          return val;
        },
      )
      .option(
        '--type <type>',
        'Transport layer of a resource (rest, graphql-code-first, graphql-schema-first, microservice, ws).',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Type cannot be empty.');

          return val;
        },
      )
      .option(
        '--crud [value]',
        'Generate CRUD entry points for a resource.',
        (val: string) => {
          if (!val.trim() || (val !== 'true' && val !== 'false')) {
            throw new InvalidArgumentError(
              'CRUD value must be either "true" or "false".',
            );
          }

          return val === 'true';
        },
      )
      .option('--no-crud', 'Generate a resource without CRUD entry points.')
      .option(
        '--prefix <prefix>',
        'Import path prefix of a library (default: @app, or defaultLibraryPrefix in nest-cli.json).',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Prefix cannot be empty.');

          return val;
        },
      )
      .option(
        '--no-interactive',
        'Never prompt: use the default for every question not answered by a flag (also the case without a TTY or under CI).',
      )
      .action(
        async (
          schematic: string,
          name: string,
          path: string,
          options: GenerateCommandOptions,
        ) => {
          if (options.interactive === false) {
            disablePrompts();
          }
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
            type: options.type,
            crud: options.crud,
            prefix: options.prefix,
          };

          try {
            await this.action.handle(context);
          } catch {
            process.exit(1);
          }
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

    if ((process.stdout.columns ?? 80) < 80) {
      return schematics
        .map((schematic) => {
          const header = `${leftMargin}${green(schematic.name)} ${cyan(
            schematic.alias,
          )}`;
          return schematic.description
            ? `${header}\n${leftMargin}  ${schematic.description}`
            : header;
        })
        .join('\n');
    }

    const tableConfig: TableConstructorOptions = {
      head: ['name', 'alias', 'description'],
      wordWrap: true,
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
    const { CollectionFactory } = await import('../lib/schematics/index.js');
    return CollectionFactory.create(collection).getSchematics();
  }
}

// Only help output shows the schematics table, and building it loads the
// collection (`@angular-devkit/schematics` for a custom one)
function isHelpRequested(args = process.argv.slice(2)): boolean {
  return (
    args.length === 0 ||
    args[0] === 'help' ||
    args.some((arg) => arg === '--help' || /^-[a-zA-Z]*h/.test(arg))
  );
}
