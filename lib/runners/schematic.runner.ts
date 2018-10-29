import { join, sep } from 'path';
import { existsSync } from 'fs';
import { AbstractRunner } from './abstract.runner';

export class SchematicRunner extends AbstractRunner {
  constructor() {
    super(`"${SchematicRunner.findClosestSchematicsBinary(__dirname)}"`);
  }

  static findClosestSchematicsBinary(path: string): string {
    const segments = path.split(sep);
    const binaryPath = ['node_modules', '.bin', 'schematics'];

    const schematicsWhenGlobal = [
      sep,
      ...segments.slice(0, segments.lastIndexOf('cli') + 1),
      ...binaryPath,
    ];
    const schematicsGlobalPath = join(...schematicsWhenGlobal);

    const schematicsWhenLocal = [
      sep,
      ...segments.slice(0, segments.lastIndexOf('node_modules')),
      ...binaryPath,
    ];
    const schematicsLocalPath = join(...schematicsWhenLocal);

    if (existsSync(schematicsGlobalPath)) {
      return schematicsGlobalPath;
    }
    if (existsSync(schematicsLocalPath)) {
      return schematicsLocalPath;
    }

    return join(__dirname, '../..', 'node_modules/.bin/schematics');
  }
}
