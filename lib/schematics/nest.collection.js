const { AbstractCollection } = require('./abstract.collection');

class NestCollection extends AbstractCollection {
  constructor(runner) {
    super('@nestjs/schematics', runner);
  }
}

module.exports = { NestCollection };