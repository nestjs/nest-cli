import { Command, CommanderStatic } from 'commander';
import { getRemainingFlags } from '../lib/utils/remaining-flags';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

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
      .option('-p, --project [project]', 'Project in which to generate files.')
      .usage('<library> [options] [library-specific-options]')
      .action(async (library: string, command: Command) => {
        const options: Input[] = [];
        options.push({ name: 'dry-run', value: !!command.dryRun });
        options.push({
          name: 'project',
          value: command.project,
        });

        const inputs: Input[] = [];
        inputs.push({ name: 'library', value: library });

        const flags = getRemainingFlags(program);
        try {
          await this.action.handle(inputs, options, flags);
        } catch (err) {
          process.exit(1);
        }
      });
  }
}
