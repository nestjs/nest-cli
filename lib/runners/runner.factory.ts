import chalk from 'chalk';
import { Runner } from './runner';
import { SchematicRunner } from './schematic.runner';
import { NpmRunner } from './npm.runner';
import { YarnRunner } from './yarn.runner';
import { RunnerLogger } from './runner.logger';

export class RunnerFactory {
  public static create(runner: Runner, logger: RunnerLogger) {
    switch (runner) {
      case Runner.SCHEMATIC:
        return new SchematicRunner(logger);
      case Runner.NPM:
        return new NpmRunner(logger);
      case Runner.YARN:
        return new YarnRunner(logger);
      default:
        logger.info(chalk.yellow(`[WARN] Unsupported runner: ${ runner }`));
    }
  }
}
