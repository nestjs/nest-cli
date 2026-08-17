import { Runner, RunnerFactory } from '../runners/index.js';
import { SchematicRunner } from '../runners/schematic.runner.js';
import { AbstractCollection } from './abstract.collection.js';
import { Collection } from './collection.js';
import { CustomCollection } from './custom.collection.js';
import { NestCollection } from './nest.collection.js';

export class CollectionFactory {
  public static create(collection: Collection | string): AbstractCollection {
    const schematicRunner = RunnerFactory.create(
      Runner.SCHEMATIC,
    ) as SchematicRunner;

    if (collection === Collection.NESTJS) {
      return new NestCollection(schematicRunner);
    } else {
      return new CustomCollection(collection, schematicRunner);
    }
  }
}
