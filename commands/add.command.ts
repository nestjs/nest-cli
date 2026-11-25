import { type Command, InvalidArgumentError } from 'commander';
import { getRemainingFlags } from '../lib/utils/remaining-flags.js';
import { AbstractCommand } from './abstract.command.js';
import type { AddCommandContext } from './context/index.js';

export class AddCommand extends AbstractCommand {
  public load(program: Command): void {
    type AddCommandOptions = {
      dryRun?: boolean;
      skipInstall: boolean;
      project?: string;
    };

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
      .option(
        '-p, --project <project>',
        'Project in which to generate files.',
        (val: string) => {
          if (!val.trim())
            throw new InvalidArgumentError('Project cannot be empty.');
          return val;
        },
      )
      .usage('<library> [options] [library-specific-options]')
      .action(
        async (
          library: string,
          options: AddCommandOptions,
          command: Command,
        ) => {
          const context: AddCommandContext = {
            library,
            dryRun: !!options.dryRun,
            skipInstall: options.skipInstall,
            project: options.project,
            extraFlags: getRemainingFlags(command),
          };

          try {
            await this.action.handle(context);
          } catch {
            process.exit(1);
          }
        },
      );
  }
}
