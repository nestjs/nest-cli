import { Command } from 'commander';
import { AbstractCommand } from './abstract.command.js';
import { DeployCommandContext } from './context/index.js';

export class DeployCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command('deploy')
      // Every option belongs to `mau deploy`, so nothing is claimed here and
      // whatever the user typed is passed straight through.
      .allowUnknownOption()
      .allowExcessArguments()
      .usage('[mau-options]')
      .description('Deploy your application to the cloud (powered by Mau).')
      .action(async (_options: Record<string, any>, command: Command) => {
        const context: DeployCommandContext = { args: command.args };

        try {
          await this.action.handle(context);
        } catch {
          process.exit(1);
        }
      });
  }
}
