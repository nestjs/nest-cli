const chalk = require('chalk');
const { AbstractPackageManager } = require('./abstract.package-manager');
const { PackageManager } = require('./package-manager');
const { Runner, RunnerFactory } = require('../runners');
const { messages } = require('../ui');
const ora = require('ora');

class YarnPackageManager extends AbstractPackageManager {
  constructor(logger) {
    super(RunnerFactory.create(Runner.YARN, logger), logger);
  }

  install(directory) {
    const spinner = ora({
      spinner: {
        "interval": 120,
        "frames": [
          "▹▹▹▹▹",
          "▸▹▹▹▹",
          "▹▸▹▹▹",
          "▹▹▸▹▹",
          "▹▹▹▸▹",
          "▹▹▹▹▸"
        ]
      },
      text: messages.PACKAGE_MANAGER_INSTALLATION_IN_PROGRESS
    });
    spinner.start();
    super.install(directory)
      .then(() => {
        spinner.succeed();
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
    return PackageManager.YARN.toUpperCase();
  }
}

module.exports = { YarnPackageManager };