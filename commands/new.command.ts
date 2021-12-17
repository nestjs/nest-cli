import { Command, CommanderStatic } from 'commander';
import { Collection } from '../lib/schematics';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class NewCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('new [name]')
      .alias('n')
      .description('Generate Nest application.')
      .option('--directory [directory]', 'Specify the destination directory')
      .option(
        '-d, --dry-run',
        'Report actions that would be performed without writing out results.',
      )
      .option('-g, --skip-git', 'Skip git repository initialization.')
      .option('-s, --skip-install', 'Skip package installation.')
      .option(
        '-p, --package-manager [packageManager]',
        'Specify package manager.',
      )
      .option(
        '-l, --language [language]',
        'Programming language to be used (TypeScript or JavaScript).',
      )
      .option(
        '-c, --collection [collectionName]',
        'Schematics collection to use.',
      )
      .option('--strict', 'Enables strict mode in TypeScript.')
      .action(async (name: string, command: Command) => {
        const options: Input[] = [];
        const availableLanguages = ['js', 'ts', 'javascript', 'typescript'];
        options.push({ name: 'directory', value: command.directory });
        options.push({ name: 'dry-run', value: !!command.dryRun });
        options.push({ name: 'skip-git', value: !!command.skipGit });
        options.push({ name: 'skip-install', value: !!command.skipInstall });
        options.push({ name: 'strict', value: !!command.strict });
        options.push({
          name: 'packageManager',
          value: command.packageManager?.trim().toLowerCase(),
        });
        options.push({
          name: 'collection',
          value: command.collection || Collection.NESTJS,
        });

        if (!!command.language) {
          const lowercasedLanguage = (command.language as string).toLowerCase();
          const langMatch = availableLanguages.includes(lowercasedLanguage);
          if (!langMatch) {
            throw new Error(
              `Invalid language "${command.language}" selected. Available languages are "typescript" or "javascript"`,
            );
          }
          switch (lowercasedLanguage) {
            case 'javascript':
              command.language = 'js';
              break;
            case 'typescript':
              command.language = 'ts';
              break;
            default:
              command.language = lowercasedLanguage;
              break;
          }
        }
        options.push({
          name: 'language',
          value: !!command.language ? command.language : 'ts',
        });

        const inputs: Input[] = [];
        inputs.push({ name: 'name', value: name });

        await this.action.handle(inputs, options);
      });
  }
}
