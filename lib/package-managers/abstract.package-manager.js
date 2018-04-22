class AbstractPackageManager {
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

  get name() {
    return '';
  }
}

module.exports = { AbstractPackageManager };