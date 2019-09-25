import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { AbstractRunner } from './abstract.runner';

export class SchematicRunner extends AbstractRunner {
  constructor() {
    super(`"${SchematicRunner.findClosestSchematicsBinary()}"`);
  }

  public static getModulePaths() {
    return module.paths;
  }

  public static findClosestSchematicsBinary(): string {
    const subPath = join('.bin', 'schematics');
    for (const path of this.getModulePaths()) {
      const binaryPath = resolve(path, subPath);
      if (existsSync(binaryPath)) {
        return binaryPath;
      }
    }

    throw new Error("'schematics' binary path could not be found!");
  }
}
