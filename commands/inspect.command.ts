import { Command } from 'commander';
import { AbstractCommand } from './abstract.command.js';

export class InspectCommand extends AbstractCommand {
  public load(program: Command) {
    program
      .command('inspect')
      .description('Display resolved Nest project configuration.')
      .option('-p, --project [project]', 'Project to inspect.')
      .option('--all', 'Show all projects in a monorepo.')
      .option('--json', 'Output as JSON.')
      .action(async (options: Record<string, any>) => {
        await this.action.handle({
          project: options.project,
          all: !!options.all,
          json: !!options.json,
        });
      });
  }
}
