import { AbstractRunner } from './abstract.runner';

export class NpmRunner extends AbstractRunner {
  constructor() {
    super('npm');
  }
}
