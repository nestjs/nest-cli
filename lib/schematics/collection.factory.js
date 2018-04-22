const { Runner, RunnerFactory } = require('../runners');
const { Collection } = require('./collection');
const { NestCollection } = require('./nest.collection');
const { CustomCollection } = require('./custom.collection');

class CollectionFactory {
  static create(collection, logger) {
    switch (collection) {
      case Collection.NESTJS:
        return new NestCollection(RunnerFactory.create(Runner.SCHEMATIC, logger));
      default:
        return new CustomCollection(collection, RunnerFactory.create(Runner.SCHEMATIC, logger)); 
    }
  }
}

module.exports = { CollectionFactory };