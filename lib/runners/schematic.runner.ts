import { join } from 'path';
import { AbstractRunner } from './abstract.runner';

export class SchematicRunner extends AbstractRunner {
  constructor() {
    super(`"${ join(__dirname, '../..', 'node_modules/.bin/schematics') }"`);
  }
}
