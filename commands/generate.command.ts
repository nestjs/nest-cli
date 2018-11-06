import { Command, CommanderStatic } from 'commander';
import { AbstractCommand } from './abstract.command';
import { Input } from './command.input';

export class GenerateCommand extends AbstractCommand {
  public load(program: CommanderStatic) {
    program
      .command('generate <schematic> <name> [path]')
      .alias('g')
      .description('Generate a Nest element.')
      .option('--dry-run', 'Allow to test changes before command execution')
      .option('--flat', 'Enforce flat structure of generated element')
      .option('--no-spec', 'Disable spec files generation')
      .action(
        async (
          schematic: string,
          name: string,
          path: string,
          command: Command,
        ) => {
          const options: Input[] = [];
          options.push({ name: 'dry-run', value: !!command.dryRun });
          options.push({ name: 'flat', value: command.flat });
          options.push({
            name: 'spec',
            value: command.spec,
          });

          const inputs: Input[] = [];
          inputs.push({ name: 'schematic', value: schematic });
          inputs.push({ name: 'name', value: name });
          inputs.push({ name: 'path', value: path });

          await this.action.handle(inputs, options);
        },
      );
  }
}
