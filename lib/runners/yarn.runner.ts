import { AbstractRunner } from './abstract.runner.js';

export class YarnRunner extends AbstractRunner {
  constructor() {
    super('yarn');
  }
}
