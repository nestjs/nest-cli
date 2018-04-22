const chalk = require('chalk');
const { AbstractPackageManager } = require('./abstract.package-manager');
const { PackageManager } = require('./package-manager');
const { Runner, RunnerFactory } = require('../runners');

class YarnPackageManager extends AbstractPackageManager {
  constructor(logger) {
    super(RunnerFactory.create(Runner.YARN, logger), logger);
  }

  install(directory) {
    this.logger.info(chalk.green('Installing packages for tooling via yarn'));
    super.install(directory)
      .then(() => this.logger.info(chalk.green('Installed packages for tooling via yarn')))
      .catch(() => {
        const message = 'Package install failed, see above.';
        this.logger.error(chalk.red(message));
      });
  }

  get name() {
    return PackageManager.YARN.toUpperCase();
  }
}

module.exports = { YarnPackageManager };