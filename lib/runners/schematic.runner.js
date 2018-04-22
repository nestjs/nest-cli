const { AbstractRunner } = require('./abstract.runner');
const join = require('path').join;

class SchematicRunner extends AbstractRunner {
  constructor(logger) {
    super(logger, join(__dirname, '../..', 'node_modules/.bin/schematics'));
  }
}

module.exports = { SchematicRunner };