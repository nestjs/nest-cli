const join = require('path').join;

class AbstractPackageManager {
  constructor(runner, logger) {
    this.runner = runner;
    this.logger = logger;
  }

  install(directory) {
    const command = 'install --silent';
    const collect = true;
    return this.runner.run(command, collect, join(process.cwd(), directory));
  }

  version() {
    const command = '--version';
    const collect = true;
    return this.runner.run(command, collect);
  }

  get name() {
    return '';
  }
}

module.exports = { AbstractPackageManager };