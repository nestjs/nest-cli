import { join } from 'path';
import { AbstractRunner } from './abstract.runner';
import { RunnerLogger } from './runner.logger';

export class SchematicRunner extends AbstractRunner {
  constructor(logger: RunnerLogger) {
    super(logger, join(__dirname, '../..', 'node_modules/.bin/schematics'));
  }
}
