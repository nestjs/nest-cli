import { AbstractRunner } from './abstract.runner';

export class YarnRunner extends AbstractRunner {
  constructor() {
    super('yarn');
  }
}
