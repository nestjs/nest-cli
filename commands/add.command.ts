import { Command, CommanderStatic } from 'commander';
import { getRemainingFlags } from '../lib/utils/remaining-flags';
import { AbstractCommand } from './abstract.command';
import { Input, CommandInputsContainer } from './command.input';

export class AddCommand extends AbstractCommand {
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
        const commandOptions = new CommandInputsContainer();

        commandOptions.addInput({ name: 'dry-run', value: !!command.dryRun });
        commandOptions.addInput({
          name: 'skip-install',
          value: command.skipInstall,
        });
        commandOptions.addInput({
          name: 'project',
          value: command.project,
        });

        const inputs: Input[] = [];
        inputs.push({ name: 'library', value: library });

        const flags = getRemainingFlags(program);
        try {
          await this.action.handle(inputs, commandOptions, flags);
        } catch (err) {
          process.exit(1);
        }
      });
  }
}
