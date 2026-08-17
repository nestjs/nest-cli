import { AbstractRunner } from './abstract.runner.js';

export class NpmRunner extends AbstractRunner {
  constructor() {
    super('npm');
  }
}
