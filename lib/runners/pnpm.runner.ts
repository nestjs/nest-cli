import { AbstractRunner } from './abstract.runner.js';

export class PnpmRunner extends AbstractRunner {
  constructor() {
    super('pnpm');
  }
}
