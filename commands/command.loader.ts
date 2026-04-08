import { red } from 'ansis';
import { Command } from 'commander';
import {
  AddAction,
  BuildAction,
  GenerateAction,
  InfoAction,
  NewAction,
  StartAction,
} from '../actions/index.js';
import { ERROR_PREFIX } from '../lib/ui/index.js';
import { AddCommand } from './add.command.js';
import { BuildCommand } from './build.command.js';
import { GenerateCommand } from './generate.command.js';
import { UnusedRoutesCommand } from './unused-routes.command.js';
import { UnusedRoutesAction } from '../actions/unused-routes.action.js';
import { InfoCommand } from './info.command.js';
import { NewCommand } from './new.command.js';
import { StartCommand } from './start.command.js';

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

    new NewCommand(new NewAction()).load(program);
    new BuildCommand(new BuildAction()).load(program);
    new StartCommand(new StartAction()).load(program);
    new InfoCommand(new InfoAction()).load(program);
    new AddCommand(new AddAction()).load(program);
    await new GenerateCommand(new GenerateAction()).load(program);

    new UnusedRoutesCommand(new UnusedRoutesAction()).load(program);
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
