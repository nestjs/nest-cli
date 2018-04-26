import { AbstractCollection } from './abstract.collection';

export class NestCollection extends AbstractCollection {
  constructor(runner) {
    super('@nestjs/schematics', runner);
  }
}
