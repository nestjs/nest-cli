import { AbstractCollection } from './abstract.collection';
import { AbstractRunner } from '../runners';

export class NestCollection extends AbstractCollection {
  constructor(runner: AbstractRunner) {
    super('@nestjs/schematics', runner);
  }
}
