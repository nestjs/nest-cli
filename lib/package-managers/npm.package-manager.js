const chalk = require('chalk');
const { AbstractPackageManager } = require('./abstract.package-manager');
const { PackageManager } = require('./package-manager');
const { Runner, RunnerFactory } = require('../runners');

class NpmPackageManager extends AbstractPackageManager {
  constructor(logger) {
    super(RunnerFactory.create(Runner.NPM, logger), logger);
  }

  install(directory) {
    this.logger.info(chalk.green('Installing packages for tooling via npm'));
    super.install(directory)
      .then(() => this.logger.info(chalk.green('Installed packages for tooling via npm')))
      .catch(() => {
        const message = 'Package install failed, see above.';
        this.logger.error(chalk.red(message));
      });
  }

  get name() {
    return PackageManager.NPM.toUpperCase();
  }
}

module.exports = { NpmPackageManager };