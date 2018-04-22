const spawn = require('child_process').spawn;
const chalk = require('chalk');
const { Runner } = require('./runner');


class AbstractRunner {
  constructor(logger, binary) {
    this.logger = logger;
    this.binary = binary;
  }

  run(command, collect = false, cwd = process.cwd()) {
    const args = [ command ];
    const options = {
      stdio: collect ? 'pipe' : 'inherit',
      shell: true,
      cwd: cwd
    };
    return new Promise((resolve, reject) => {
      const child = spawn(this.binary, args, options);
      if (collect) {
        child.stdout.on('data', (data) => resolve(data.toString().replace(/\r\n|\n/, '')));
      }
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          const message = `Failed to execute command : ${ command }, see above.`;
          this.logger.error(chalk.red(message));
          reject(message);
        }
      });
    });
  }
}

module.exports = { AbstractRunner };