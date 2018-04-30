import { AbstractRunner } from './abstract.runner';
import { RunnerLogger } from './runner.logger';

export class NpmRunner extends AbstractRunner {
  constructor(logger: RunnerLogger) {
    super(logger, 'npm');
  }
}
