const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { RUNNERS, Runner } = require('./runners');

const PACKAGE_MANAGERS = {
  NPM: 'npm',
  YARN: 'yarn'
};

class PackageManager {
  constructor(runner, logger) {
    this.runner = runner;
    this.logger = logger;
  }

  install(directory) {
    const command = 'install --silent';
    const collect = false;
    return this.runner.run(command, collect, path.join(process.cwd(), directory));
  }

  version() {
    const command = '--version';
    const collect = true;
    return this.runner.run(command, collect);
  }

  getName() {
    return '';
  }

  static create(name, logger) {
    switch (name) {
      case PACKAGE_MANAGERS.NPM:
        return new NpmPackageManager(logger);
      case PACKAGE_MANAGERS.YARN:
        return new YarnPackageManager(logger);
    }
  }

  static find(logger) {
    return new Promise((resolve) => {
      fs.readdir(process.cwd(), (error, files) => {
        if (error) {
          resolve(this.create(PACKAGE_MANAGERS.NPM, logger));
        } else {
          if (files.findIndex((filename) => filename === 'yarn.lock') > -1) {
            resolve(this.create(PACKAGE_MANAGERS.YARN, logger))
          } else {
            resolve(this.create(PACKAGE_MANAGERS.NPM, logger));
          }
        }
      });
    });
  }
}

class NpmPackageManager extends PackageManager {
  constructor(logger) {
    super(Runner.create(RUNNERS.NPM, logger), logger);
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

  getName() {
    return PACKAGE_MANAGERS.NPM.toUpperCase();
  }
}

class YarnPackageManager extends PackageManager {
  constructor(logger) {
    super(Runner.create(RUNNERS.YARN, logger), logger);
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

  getName() {
    return PACKAGE_MANAGERS.YARN.toUpperCase();
  }
}

module.exports = { PACKAGE_MANAGERS, PackageManager } ;