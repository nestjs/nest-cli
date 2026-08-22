import { Command } from 'commander';
import { AbstractCommand } from './abstract.command.js';
import { UpgradeCommandContext } from './context/index.js';

export class UpgradeCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command('upgrade')
      .alias('update')
      .description('Upgrade your project to the latest NestJS major version.')
      .option(
        '-d, --dry-run',
        'Report actions that would be performed without writing out results.',
      )
      .option('-s, --skip-install', 'Skip package installation.', false)
      .option('--observe', 'Set up @nestjs/observe (skips the prompt).')
      .option(
        '--no-observe',
        'Do not set up @nestjs/observe (skips the prompt).',
      )
      .option(
        '-t, --tag [tag]',
        'Use an npm dist-tag (e.g. "next") instead of the default version ranges.',
      )
      .option(
        '-c, --collection [collectionName]',
        'Schematics collection to use.',
      )
      .action(async (options: Record<string, any>) => {
        const context: UpgradeCommandContext = {
          dryRun: !!options.dryRun,
          skipInstall: options.skipInstall,
          // Stays `undefined` when neither --observe nor --no-observe was
          // given so the schematic can prompt for it.
          observe: options.observe,
          tag: options.tag,
          collection: options.collection,
        };

        try {
          await this.action.handle(context);
        } catch {
          process.exit(1);
        }
      });
  }
}
