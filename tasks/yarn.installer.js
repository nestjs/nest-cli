const spawn = require('child_process').spawn;
const path = require('path');
const chalk = require('chalk');

class YarnInstaller {
  constructor(logger) {
    this.logger = logger;
  }

  install(directory) {
    this.logger.info(chalk.green('Installing packages for tooling via yarn'));
    const args = [ 'install', '--silent' ];
    const options = {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(process.cwd(), directory)
    };
    return new Promise((resolve, reject) => {
      spawn('yarn', args, options)
        .on('close', (code) => {
          if (code === 0) {
            this.logger.info(chalk.green('Installed packages for tooling via yarn'));
            resolve();
          } else {
            const message = 'Package install failed, see above.';
            this.logger.error(chalk.red(message));
            reject(message);
          }
        })
    });
  }
}

module.exports = YarnInstaller;