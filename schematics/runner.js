const exec = require('child_process').exec;

class SchematicRunner {
  constructor(logger) {
    this.logger = logger;
  }

  run(schematic) {
    return new Promise((resolve, reject) => {
      exec(schematic.command(), (error, stdout, stderr) => {
        if (error !== undefined && error !== null) {
          this.logger.error(stderr);
          reject(error);
        } else {
          this.logger.info(stdout);
          resolve();
        }
      });
    });
  }
}

module.exports = SchematicRunner;
