import { NpmRunner } from './npm.runner.js';
import { PnpmRunner } from './pnpm.runner.js';
import { Runner } from './runner.js';
import { SchematicRunner } from './schematic.runner.js';
import { YarnRunner } from './yarn.runner.js';

export class RunnerFactory {
  public static create(runner: Runner) {
    switch (runner) {
      case Runner.SCHEMATIC:
        return new SchematicRunner();

      case Runner.NPM:
        return new NpmRunner();

      case Runner.YARN:
        return new YarnRunner();

      case Runner.PNPM:
        return new PnpmRunner();

      default:
        throw new Error(`Unsupported runner: ${runner}`);
    }
  }
}
