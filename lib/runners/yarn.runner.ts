import { AbstractRunner } from './abstract.runner';
import { RunnerLogger } from './runner.logger';

export class YarnRunner extends AbstractRunner {
  constructor(logger: RunnerLogger) {
    super(logger, 'yarn');
  }
}
