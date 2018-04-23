const spawn = require('child_process').spawn;
const chalk = require('chalk');
const { Runner } = require('./runner');
const { messages } = require('../ui');

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
          this.logger.error(chalk.red(messages.RUNNER_EXECUTION_ERROR(command)));
          reject();
        }
      });
    });
  }
}

module.exports = { AbstractRunner };