import { AbstractRunner } from './abstract.runner';

export class CleanRunner extends AbstractRunner {
  constructor() {
    super('rm');
  }
}
