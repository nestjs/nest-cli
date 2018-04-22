const { AbstractRunner } = require('./abstract.runner');

class NpmRunner extends AbstractRunner {
  constructor(logger) {
    super(logger, 'npm');
  }
}

module.exports = { NpmRunner };