const spawn = require('child_process').spawn;
const path = require('path');
const chalk = require('chalk');

const RUNNERS = {
  SCHEMATIC: 0,
  NPM: 1,
  YARN: 2
};

class Runner {
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

  static create(runner, logger) {
    switch (runner) {
      case RUNNERS.SCHEMATIC:
        return new SchematicRunner(logger);
      case RUNNERS.NPM:
        return new NpmRunner(logger);
      case RUNNERS.YARN:
        return new YarnRunner(logger);
      default:
        logger.info(chalk.yellow('[WARN] Unsupported runner'));
    }
  }
}

class SchematicRunner extends Runner {
  constructor(logger) {
    super(logger, path.join(__dirname, '..', 'node_modules/.bin/schematics'));
  }
}

class NpmRunner extends Runner {
  constructor(logger) {
    super(logger, 'npm');
  }
}

class YarnRunner extends Runner {
  constructor(logger) {
    super(logger, 'yarn');
  }
}

module.exports = {
  RUNNERS,
  Runner,
  SchematicRunner
};
