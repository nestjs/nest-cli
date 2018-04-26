import { join } from 'path';
import { AbstractRunner } from './abstract.runner';

export class SchematicRunner extends AbstractRunner {
  constructor(logger) {
    super(logger, join(__dirname, '../..', 'node_modules/.bin/schematics'));
  }
}
