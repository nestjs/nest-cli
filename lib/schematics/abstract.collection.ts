import { AbstractRunner } from '../runners';
import { SchematicOption } from './schematic.option';

export class AbstractCollection {
  constructor(protected collection: string, protected runner: AbstractRunner) {}

  public async execute(name: string, options: SchematicOption[]) {
    const command = this.buildCommandLine(name, options);
    await this.runner.run(command);
  }

  private buildCommandLine(name: string, options: SchematicOption[]): string {
    return `${this.collection}:${name}${this.buildOptions(options)}`;
  }

  private buildOptions(options: SchematicOption[]): string {
    return options.reduce((line, option) => line.concat(` ${option.toCommandString()}`), '');
  }
}
