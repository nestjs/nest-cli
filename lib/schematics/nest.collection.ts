import { AbstractRunner } from '../runners';
import { AbstractCollection } from './abstract.collection';
import { SchematicOption } from './schematic.option';

export interface Schematic {
  name: string;
  alias: string;
  description: string;
}

export class NestCollection extends AbstractCollection {
  private static schematics: Schematic[] = [
    {
      name: 'application',
      alias: 'application',
      description: 'Generate a new application workspace',
    },
    {
      name: 'angular-app',
      alias: 'ng-app',
      description: '',
    },
    {
      name: 'class',
      alias: 'cl',
      description: 'Generate a new class',
    },
    {
      name: 'configuration',
      alias: 'config',
      description: 'Generate a CLI configuration file',
    },
    {
      name: 'controller',
      alias: 'co',
      description: 'Generate a controller declaration',
    },
    {
      name: 'decorator',
      alias: 'd',
      description: 'Generate a custom decorator',
    },
    {
      name: 'filter',
      alias: 'f',
      description: 'Generate a filter declaration',
    },
    {
      name: 'gateway',
      alias: 'ga',
      description: 'Generate a gateway declaration',
    },
    {
      name: 'guard',
      alias: 'gu',
      description: 'Generate a guard declaration',
    },
    {
      name: 'interceptor',
      alias: 'in',
      description: 'Generate an interceptor declaration',
    },
    {
      name: 'interface',
      alias: 'interface',
      description: 'Generate an interface',
    },
    {
      name: 'middleware',
      alias: 'mi',
      description: 'Generate a middleware declaration',
    },
    {
      name: 'module',
      alias: 'mo',
      description: 'Generate a module declaration',
    },
    {
      name: 'pipe',
      alias: 'pi',
      description: 'Generate a pipe declaration',
    },
    {
      name: 'provider',
      alias: 'pr',
      description: 'Generate a provider declaration',
    },
    {
      name: 'resolver',
      alias: 'r',
      description: 'Generate a GraphQL resolver declaration',
    },
    {
      name: 'service',
      alias: 's',
      description: 'Generate a service declaration',
    },
    {
      name: 'library',
      alias: 'lib',
      description: 'Generate a new library within a monorepo',
    },
    {
      name: 'sub-app',
      alias: 'app',
      description: 'Generate a new application within a monorepo',
    },
    {
      name: 'resource',
      alias: 'res',
      description: 'Generate a new CRUD resource',
    },
  ];

  constructor(runner: AbstractRunner) {
    super('@nestjs/schematics', runner);
  }

  public async execute(name: string, options: SchematicOption[]) {
    const schematic: string = this.validate(name);
    await super.execute(schematic, options);
  }

  public static getSchematics(): Schematic[] {
    return NestCollection.schematics.filter(
      (item) => item.name !== 'angular-app',
    );
  }

  private validate(name: string) {
    const schematic = NestCollection.schematics.find(
      (s) => s.name === name || s.alias === name,
    );

    if (schematic === undefined || schematic === null) {
      throw new Error(
        `Invalid schematic "${name}". Please, ensure that "${name}" exists in this collection.`,
      );
    }
    return schematic.name;
  }
}
