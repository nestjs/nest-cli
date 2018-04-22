const { AbstractRunner } = require('./abstract.runner');

class YarnRunner extends AbstractRunner {
  constructor(logger) {
    super(logger, 'yarn');
  }
}

module.exports = { YarnRunner };