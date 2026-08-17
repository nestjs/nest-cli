import { createRequire } from 'module';
import { AbstractRunner } from './abstract.runner.js';

const require = createRequire(import.meta.url);

export class SchematicRunner extends AbstractRunner {
  constructor() {
    super(`node`, [`"${SchematicRunner.findClosestSchematicsBinary()}"`]);
  }

  public static getModulePaths() {
    return require.resolve.paths('@angular-devkit/schematics-cli') ?? [];
  }

  public static findClosestSchematicsBinary(): string {
    try {
      return require.resolve(
        '@angular-devkit/schematics-cli/bin/schematics.js',
        { paths: this.getModulePaths() },
      );
    } catch {
      throw new Error("'schematics' binary path could not be found!");
    }
  }
}
