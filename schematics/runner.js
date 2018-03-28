const path = require('path');
const exec = require('child_process').exec;

class SchematicRunner {
  constructor(logger) {
    this.logger = logger;
    this.schematicsBinary = path.join(__dirname, '..', 'node_modules/.bin/schematics')
  }

  run(command) {
    return new Promise((resolve, reject) => {
      exec(`${ this.schematicsBinary } ${ command }`, (error, stdout, stderr) => {
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
