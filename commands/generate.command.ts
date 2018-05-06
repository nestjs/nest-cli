import { AbstractCommand } from './abstract.command';

export class GenerateCommand extends AbstractCommand {
  public load(program: any) {
    program
      .command('generate')
      .alias('g')
      .argument('<schematic>', 'Nest framework asset type')
      .argument('<name>', 'Asset name or path')
      .argument('[path]', 'Path to generate the asset')
      .option('--dry-run', 'allow to test changes before execute command')
      .action(this.action.handle);
  }
}
