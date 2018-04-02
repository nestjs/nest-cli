const { strings } = require('@angular-devkit/core');
const { Runner, RUNNERS } = require('./runners');

const COLLECTIONS = {
  NESTJS: 0
};

class SchematicOption {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  toCommandString() {
    if (typeof this.value === 'string') {
      return `--${ strings.dasherize(this.name) }=${ strings.dasherize(this.value) }`;
    } else {
      return `--${ strings.dasherize(this.name) }=${ this.value }`;
    }
  }
}

class Schematic {
  constructor(collection, runner) {
    this.collection = collection;
    this.runner = runner;
  }

  execute(name, options) {
    const command = this._buildCommandLine(name, options);
    return this.runner.run(command);
  }

  _buildCommandLine(name, options) {
    return `${ this.collection }:${ name }${ this._buildOptions(options) }`;
  }

  _buildOptions(options) {
    return options.reduce((line, option) => {
      return line.concat(` ${ option.toCommandString() }`);
    }, '');
  }

  static create(collection, logger) {
    switch (collection) {
      case COLLECTIONS.NESTJS:
        return new NestSchematics(Runner.create(RUNNERS.SCHEMATIC, logger));
    }
  }
}

class NestSchematics extends Schematic {
  constructor(runner) {
    super('@nestjs/schematics', runner);
  }
}

module.exports = {
  COLLECTIONS,
  Schematic,
  SchematicOption
};
