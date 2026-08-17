import { Command } from 'commander';
import { getRemainingFlags } from '../lib/utils/remaining-flags.js';
import { AbstractCommand } from './abstract.command.js';
import { AddCommandContext } from './context/index.js';

export class AddCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command('add <library>')
      .allowUnknownOption()
      // Unknown options are collected into `args`, which commander otherwise
      // rejects as excess arguments — that would break the documented
      // library-specific options this command forwards via `extraFlags`.
      .allowExcessArguments()
      .description('Adds support for an external library to your project.')
      .option(
        '-d, --dry-run',
        'Report actions that would be performed without writing out results.',
      )
      .option('-s, --skip-install', 'Skip package installation.', false)
      .option('-p, --project [project]', 'Project in which to generate files.')
      .usage('<library> [options] [library-specific-options]')
      .action(async (library: string, options: Record<string, any>) => {
        const context: AddCommandContext = {
          library,
          dryRun: !!options.dryRun,
          skipInstall: options.skipInstall,
          project: options.project,
          extraFlags: getRemainingFlags(program),
        };

        try {
          await this.action.handle(context);
        } catch {
          process.exit(1);
        }
      });
  }
}
