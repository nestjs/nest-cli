const spawn = require('child_process').spawn;
const path = require('path');
const chalk = require('chalk');

class SchematicRunner {
  constructor(logger) {
    this.logger = logger;
    this.schematicsBinary = path.join(__dirname, '..', 'node_modules/.bin/schematics')
  }

  run(command) {
    const args = [ command ];
    const options = {
      stdio: 'inherit',
      shell: true
    };
    return new Promise((resolve, reject) => {
      spawn(this.schematicsBinary, args, options)
        .on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            const message = `Fail to execute schematics command : ${ command }, see above.`;
            this.logger.error(chalk.red(message));
            reject(message);
          }
      });
    });
  }
}

module.exports = SchematicRunner;
