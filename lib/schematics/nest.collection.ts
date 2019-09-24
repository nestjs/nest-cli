import { AbstractRunner } from '../runners';
import { AbstractCollection } from './abstract.collection';
import { SchematicOption } from './schematic.option';

export interface Schematic {
  name: string;
  alias: string;
}

export class NestCollection extends AbstractCollection {
  private static schematics: Schematic[] = [
    { name: 'application', alias: 'application' },
    { name: 'angular-app', alias: 'ng-app' },
    { name: 'class', alias: 'cl' },
    { name: 'configuration', alias: 'config' },
    { name: 'controller', alias: 'co' },
    { name: 'decorator', alias: 'd' },
    { name: 'filter', alias: 'f' },
    { name: 'gateway', alias: 'ga' },
    { name: 'guard', alias: 'gu' },
    { name: 'interceptor', alias: 'in' },
    { name: 'interface', alias: 'interface' },
    { name: 'middleware', alias: 'mi' },
    { name: 'module', alias: 'mo' },
    { name: 'pipe', alias: 'pi' },
    { name: 'provider', alias: 'pr' },
    { name: 'resolver', alias: 'r' },
    { name: 'service', alias: 's' },
    { name: 'library', alias: 'lib' },
    { name: 'sub-app', alias: 'app' },
  ];

  constructor(runner: AbstractRunner) {
    super('@nestjs/schematics', runner);
  }

  public async execute(name: string, options: SchematicOption[]) {
    const schematic: string = this.validate(name);
    await super.execute(schematic, options);
  }

  public static getSchematics(): Schematic[] {
    return NestCollection.schematics;
  }

  private validate(name: string) {
    const schematic = NestCollection.schematics.find(
      s => s.name === name || s.alias === name,
    );

    if (schematic === undefined || schematic === null) {
      throw new Error(
        `Invalid schematic "${name}". Please, ensure that "${name}" really exists in this collection.`,
      );
    }
    return schematic.name;
  }
}
