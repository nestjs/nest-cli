import { Command } from 'commander';
import { Collection } from '../lib/schematics/index.js';
import { AbstractCommand } from './abstract.command.js';
import { NewCommandContext } from './context/index.js';

export class NewCommand extends AbstractCommand {
  public load(program: Command) {
    program
      .command('new [name]')
      .alias('n')
      .description('Generate Nest application.')
      .option('--directory [directory]', 'Specify the destination directory')
      .option(
        '-d, --dry-run',
        'Report actions that would be performed without writing out results.',
        false,
      )
      .option('-g, --skip-git', 'Skip git repository initialization.', false)
      .option('-s, --skip-install', 'Skip package installation.', false)
      .option(
        '-p, --package-manager [packageManager]',
        'Specify package manager.',
      )
      .option(
        '-l, --language [language]',
        'Programming language to be used (TypeScript or JavaScript)',
        'TypeScript',
      )
      .option(
        '-c, --collection [collectionName]',
        'Schematics collection to use',
        Collection.NESTJS,
      )
      .option('--strict', 'Enables strict mode in TypeScript.', false)
      .option(
        '-t, --skip-tests',
        'Do not generate testing files for the new project.',
        false,
      )
      .action(async (name: string, options: Record<string, any>) => {
        const availableLanguages = ['js', 'ts', 'javascript', 'typescript'];

        let language = options.language;
        if (language) {
          const lowercasedLanguage = language.toLowerCase();
          const langMatch = availableLanguages.includes(lowercasedLanguage);
          if (!langMatch) {
            throw new Error(
              `Invalid language "${language}" selected. Available languages are "typescript" or "javascript"`,
            );
          }
          switch (lowercasedLanguage) {
            case 'javascript':
              language = 'js';
              break;
            case 'typescript':
              language = 'ts';
              break;
            default:
              language = lowercasedLanguage;
              break;
          }
        }

        const context: NewCommandContext = {
          name,
          directory: options.directory,
          dryRun: options.dryRun,
          skipGit: options.skipGit,
          skipInstall: options.skipInstall,
          skipTests: options.skipTests,
          packageManager: options.packageManager,
          language,
          collection: options.collection,
          strict: options.strict,
        };

        await this.action.handle(context);
      });
  }
}
