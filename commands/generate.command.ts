import { AbstractCommand } from './abstract.command';

const SCHEMATICS = [
  { value: 'class', alias: 'cl' },
  { value: 'controller', alias: 'co' },
  { value: 'decorator', alias: 'd' },
  { value: 'exception', alias: 'e' },
  { value: 'filter', alias: 'f' },
  { value: 'gateway', alias: 'ga' },
  { value: 'guard', alias: 'gu' },
  { value: 'interceptor', alias: 'i' },
  { value: 'middleware', alias: 'mi' },
  { value: 'module', alias: 'mo' },
  { value: 'pipe', alias: 'pi' },
  { value: 'provider', alias: 'pr' },
  { value: 'service', alias: 's' }
];

export class GenerateCommand extends AbstractCommand {
  public load(program: any) {
    program
      .command('generate')
      .alias('g')
      .argument('<schematic>', 'Nest framework asset type', this.validate)
      .argument('<name>', 'Asset name or path')
      .argument('[path]', 'Path to generate the asset')
      .option('--dry-run', 'allow to test changes before execute command')
      .action(this.action.handle);
  }

  private validate(arg) {
    const schematic = SCHEMATICS.find((schematic) => schematic.value === arg || schematic.alias === arg);
    if (schematic === undefined || schematic === null) {
      throw new Error();
    }
    return schematic.value;
  }
}
