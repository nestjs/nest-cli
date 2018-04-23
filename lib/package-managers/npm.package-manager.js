const chalk = require('chalk');
const { AbstractPackageManager } = require('./abstract.package-manager');
const { PackageManager } = require('./package-manager');
const { Runner, RunnerFactory } = require('../runners');
const { messages } = require('../ui');

class NpmPackageManager extends AbstractPackageManager {
  constructor(logger) {
    super(RunnerFactory.create(Runner.NPM, logger), logger);
  }

  install(directory) {
    this.logger.info(messages.PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS);
    this.logger.info();

    super.install(directory)
      .then(() => {
        this.logger.info();
        this.logger.info(messages.PACKAGE_MANAGER_INSTALLATION_SUCCEED(directory));
        this.logger.info(messages.GET_STARTED_INFORMATION);
        this.logger.info();
        this.logger.info(chalk.gray(messages.CHANGE_DIR_COMMAND(directory)));
        this.logger.info(chalk.gray(messages.START_COMMAND));
        this.logger.info();
      })
      .catch(() => {
        const message = messages.PACKAGE_MANAGER_INSTALLATION_FAILED;
        this.logger.error(chalk.red(message));
      });
  }

  get name() {
    return PackageManager.NPM.toUpperCase();
  }
}

module.exports = { NpmPackageManager };