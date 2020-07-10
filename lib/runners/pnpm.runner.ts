import { AbstractRunner } from './abstract.runner';

export class PnpmRunner extends AbstractRunner {
  constructor() {
    super('pnpm');
  }
}
