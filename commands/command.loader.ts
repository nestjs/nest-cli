import { red } from 'ansis';
import { Command } from 'commander';
import { AbstractAction } from '../actions/abstract.action.js';
import { ERROR_PREFIX } from '../lib/ui/index.js';
import { AddCommand } from './add.command.js';
import { BuildCommand } from './build.command.js';
import { DeployCommand } from './deploy.command.js';
import { GenerateCommand } from './generate.command.js';
import { InfoCommand } from './info.command.js';
import { NewCommand } from './new.command.js';
import { StartCommand } from './start.command.js';
import { UpgradeCommand } from './upgrade.command.js';

export class CommandLoader {
  public static async load(program: Command): Promise<void> {
    if (!(program as any).__nestCliEsm) {
      console.error(
        `\n${ERROR_PREFIX} The globally installed ${red('@nestjs/cli')} is outdated and ` +
          'incompatible with the local version (which requires ESM).\n' +
          'Please upgrade your global installation:\n\n' +
          `  ${red('npm i -g @nestjs/cli')}\n`,
      );
      process.exit(1);
    }

    // Actions are imported when their command runs, so that a command does
    // not load the compilers, schematics and prompts of the others
    new NewCommand(
      lazyAction(
        async () => new (await import('../actions/new.action.js')).NewAction(),
      ),
    ).load(program);
    new BuildCommand(
      lazyAction(
        async () =>
          new (await import('../actions/build.action.js')).BuildAction(),
      ),
    ).load(program);
    new StartCommand(
      lazyAction(
        async () =>
          new (await import('../actions/start.action.js')).StartAction(),
      ),
    ).load(program);
    new InfoCommand(
      lazyAction(
        async () =>
          new (await import('../actions/info.action.js')).InfoAction(),
      ),
    ).load(program);
    new AddCommand(
      lazyAction(
        async () => new (await import('../actions/add.action.js')).AddAction(),
      ),
    ).load(program);
    new DeployCommand(
      lazyAction(
        async () =>
          new (await import('../actions/deploy.action.js')).DeployAction(),
      ),
    ).load(program);
    new UpgradeCommand(
      lazyAction(
        async () =>
          new (await import('../actions/upgrade.action.js')).UpgradeAction(),
      ),
    ).load(program);
    await new GenerateCommand(
      lazyAction(
        async () =>
          new (await import('../actions/generate.action.js')).GenerateAction(),
      ),
    ).load(program);

    this.handleInvalidCommand(program);
  }

  private static handleInvalidCommand(program: Command) {
    program.on('command:*', () => {
      console.error(
        `\n${ERROR_PREFIX} Invalid command: ${red`%s`}`,
        program.args.join(' '),
      );
      console.error(`See ${red`--help`} for a list of available commands.\n`);
      process.exit(1);
    });
  }
}

function lazyAction(load: () => Promise<AbstractAction>): AbstractAction {
  return {
    handle: async (context?: any) => {
      // Most commands only exit on a failed action, so an action that fails
      // to load (a broken install) prints its error here
      const action = await load().catch((err) => {
        console.error(err);
        process.exit(1);
      });
      return action.handle(context);
    },
  };
}
