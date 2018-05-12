import { Runner, RunnerFactory } from '../runners';
import { Collection } from './collection';
import { NestCollection } from './nest.collection';
import { CustomCollection } from './custom.collection';
import { AbstractCollection } from './abstract.collection';

export class CollectionFactory {
  public static create(collection: Collection): AbstractCollection {
    switch (collection) {
      case Collection.NESTJS:
        return new NestCollection(RunnerFactory.create(Runner.SCHEMATIC));
      default:
        return new CustomCollection(collection, RunnerFactory.create(Runner.SCHEMATIC)); 
    }
  }
}
