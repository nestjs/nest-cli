const chalk = require('chalk');
const { Runner } = require('./runner');
const { SchematicRunner } = require('./schematic.runner');
const { NpmRunner } = require('./npm.runner');
const { YarnRunner } = require('./yarn.runner');

class RunnerFactory {
  static create(runner, logger) {
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

module.exports = { RunnerFactory };