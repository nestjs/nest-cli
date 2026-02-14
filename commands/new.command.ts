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
        false,
      )
      .option('-g, --skip-git', 'Skip git repository initialization.', false)
      .option('-s, --skip-install', 'Skip package installation.', false)
      .option('-p, --package-manager [packageManager]', 'Specify package manager.')
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
        const langInput = command.language?.toLowerCase();
        const langMap: Record<string, string> = {
          javascript: 'js',
          typescript: 'ts',
        };

        if (langInput && !['js', 'ts', 'javascript', 'typescript'].includes(langInput)) {
          throw new Error(
            `Invalid language "${command.language}" selected. Available languages are "typescript" or "javascript".`,
          );
        }

        command.language = langMap[langInput] || langInput;

        const cliKeys: Record<string, string> = {
          dryRun: 'dry-run',
          skipGit: 'skip-git',
          skipInstall: 'skip-install',
        };

        const options: Input[] = [
          'directory',
          'dryRun',
          'skipGit',
          'skipInstall',
          'strict',
          'packageManager',
          'collection',
          'language',
        ].map((key) => ({
          name: cliKeys[key] ?? key,
          value: command[key],
        }));

        const inputs: Input[] = [{ name: 'name', value: name }];

        await this.action.handle(inputs, options);
      });
  }
}
