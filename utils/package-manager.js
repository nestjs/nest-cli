const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class PackageManager {
  constructor(name, logger) {
    this.name = name;
    this.logger = logger;
  }

  install(directory) {
    this.logger.info(chalk.green(`Installing packages for tooling via ${ this.name }`));
    const args = [ 'install', '--silent' ];
    const options = {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(process.cwd(), directory)
    };
    return new Promise((resolve, reject) => {
      spawn(this.name, args, options)
        .on('close', (code) => {
          if (code === 0) {
            this.logger.info(chalk.green(`Installed packages for tooling via ${ this.name }`));
            resolve();
          } else {
            const message = 'Package install failed, see above.';
            this.logger.error(chalk.red(message));
            reject(message);
          }
        })
    });
  }

  version() {
    return new Promise((resolve, reject) => {
      const child = exec(`${ this.name } -v`);
      child.stdout.on('data', (data) => resolve(data.toString()));
      child.stderr.on('error', (error) => reject(error));
    });
  }

  static from(name, logger) {
    switch (name) {
      case 'npm':
        return new NpmPackageManager(logger);
      case 'yarn':
        return new YarnPackageManager(logger);
      default:
        throw new Error(`Package manager "${ name }" is not managed`);
    }
  }

  static find(logger) {
    return new Promise((resolve) => {
      fs.readdir(process.cwd(), (error, files) => {
        if (error) {
          resolve(this.from('npm', logger));
        } else {
          if (files.findIndex((filename) => filename === 'yarn.lock') > -1) {
            resolve(this.from('yarn', logger))
          } else {
            resolve(this.from('npm', logger));
          }
        }
      });

    });
  }
}

class NpmPackageManager extends PackageManager {
  constructor(logger) {
    super('npm', logger);
  }
}

class YarnPackageManager extends PackageManager {
  constructor(logger) {
    super('yarn', logger);
  }
}

module.exports = { PackageManager, NpmPackageManager, YarnPackageManager } ;