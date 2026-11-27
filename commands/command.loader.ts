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
    this.rejectMissingOptionValues(program);
  }

  /**
   * Commander sets an option declared with `[value]` to `true` when it is
   * given without a value. Only the options listed here mean something then;
   * every other one fails, as an option declared with `<value>` would, before
   * `true` reaches an action that expects a string.
   */
  private static rejectMissingOptionValues(program: Command) {
    const valueOptional = ['--debug', '--parallel', '--crud'];
    program.hook('preAction', (_, command) => {
      for (const option of command.options) {
        const name = option.attributeName();
        if (
          option.optional &&
          !valueOptional.includes(option.long ?? '') &&
          command.getOptionValueSource(name) === 'cli' &&
          command.getOptionValue(name) === true
        ) {
          command.error(`error: option '${option.flags}' argument missing`, {
            code: 'commander.optionMissingArgument',
          });
        }
      }
    });
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
