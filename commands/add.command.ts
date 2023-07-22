import { Command, CommanderStatic } from 'commander';
import type { AddAction } from '../actions';
import { getRemainingFlags } from '../lib/utils/remaining-flags';
import { AbstractCommand } from './abstract.command';
import { CommandStorage } from './command-storage';

export class AddCommand extends AbstractCommand<AddAction> {
  public load(program: CommanderStatic): void {
    program
      .command('add <library>')
      .allowUnknownOption()
      .description('Adds support for an external library to your project.')
      .option(
        '-d, --dry-run',
        'Report actions that would be performed without writing out results.',
      )
      .option('-s, --skip-install', 'Skip package installation.', false)
      .option('-p, --project [project]', 'Project in which to generate files.')
      .usage('<library> [options] [library-specific-options]')
      .action(async (library: string, command: Command) => {
        const commandOptions = new CommandStorage();

        commandOptions.add({ name: 'dry-run', value: !!command.dryRun });
        commandOptions.add({
          name: 'skip-install',
          value: command.skipInstall,
        });
        commandOptions.add({
          name: 'project',
          value: command.project,
        });

        const inputs = new CommandStorage();
        inputs.add({ name: 'library', value: library });

        const flags = getRemainingFlags(program);
        try {
          await this.action.handle(inputs, commandOptions, flags);
        } catch (err) {
          process.exit(1);
        }
      });
  }
}
