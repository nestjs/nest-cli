import { Command, CommanderStatic } from 'commander';
import { Collection } from '../lib/schematics';
import { AbstractCommand } from './abstract.command';
import { Input, CommandInputsContainer } from './command.input';

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
      .action(async (name: string, command: Command) => {
        const commandOptions = new CommandInputsContainer();

        commandOptions.addInput({
          name: 'directory',
          value: command.directory,
        });
        commandOptions.addInput({ name: 'dry-run', value: command.dryRun });
        commandOptions.addInput({ name: 'skip-git', value: command.skipGit });
        commandOptions.addInput({
          name: 'skip-install',
          value: command.skipInstall,
        });
        commandOptions.addInput({ name: 'strict', value: command.strict });
        commandOptions.addInput({
          name: 'packageManager',
          value: command.packageManager,
        });
        commandOptions.addInput({
          name: 'collection',
          value: command.collection,
        });

        const availableLanguages = ['js', 'ts', 'javascript', 'typescript'];
        if (!!command.language) {
          const lowercasedLanguage = command.language.toLowerCase();
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
        commandOptions.addInput({
          name: 'language',
          value: command.language,
        });

        const inputs: Input[] = [];
        inputs.push({ name: 'name', value: name });

        await this.action.handle(inputs, commandOptions);
      });
  }
}
