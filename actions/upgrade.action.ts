import { green, red } from 'ansis';
import { UpgradeCommandContext } from '../commands/index.js';
import {
  AbstractCollection,
  Collection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics/index.js';
import { INFO_PREFIX, MESSAGES } from '../lib/ui/index.js';
import { isInteractive } from '../lib/utils/is-interactive.js';
import { loadConfiguration } from '../lib/utils/load-configuration.js';
import { AbstractAction } from './abstract.action.js';

const schematicName = 'upgrade';

export class UpgradeAction extends AbstractAction {
  public async handle(context: UpgradeCommandContext) {
    const configuration = await loadConfiguration();
    const collectionName =
      context.collection || configuration.collection || Collection.NESTJS;
    const schematicOptions = this.mapSchematicOptions(context);

    console.info(MESSAGES.UPGRADE_IN_PROGRESS);
    try {
      const collection: AbstractCollection =
        CollectionFactory.create(collectionName);
      await collection.execute(schematicName, schematicOptions);
    } catch (error) {
      if (error instanceof Error) {
        console.error(red(error.message));
      }
      throw error;
    }

    if (context.dryRun) {
      console.info();
      console.info(green(MESSAGES.DRY_RUN_MODE));
      console.info();
      return;
    }
    // The schematic only bumps the project's local @nestjs/cli.
    console.info(`\n${INFO_PREFIX} ${MESSAGES.UPGRADE_GLOBAL_CLI_HINT}\n`);
  }

  private mapSchematicOptions(
    context: UpgradeCommandContext,
  ): SchematicOption[] {
    const options: SchematicOption[] = [];

    if (context.dryRun) options.push(new SchematicOption('dry-run', true));
    if (context.skipInstall) {
      options.push(new SchematicOption('skip-install', true));
    }
    if (context.tag !== undefined) {
      options.push(new SchematicOption('tag', context.tag));
    }

    if (context.observe !== undefined) {
      options.push(new SchematicOption('observe', context.observe));
    } else if (!isInteractive()) {
      // The schematic's `x-prompt` would block forever without a TTY (CI,
      // pipes), so answer it up front and leave prompting to TTY sessions.
      options.push(new SchematicOption('observe', false));
    }
    return options;
  }
}
