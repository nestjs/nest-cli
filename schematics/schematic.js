const path = require('path');

class SchematicBuilder {
  constructor() {
    this.options = [];
  }

  withCollectionName(collectionName) {
    this.collectionName = collectionName;
    return this;
  }

  withSchematicName(schematicName) {
    this.schematicName = schematicName;
    return this;
  }

  withArgs(args) {
    this.args = args;
    return this;
  }

  withOptions(options) {
    this.options = options;
    return this;
  }

  build() {
    if (this.options[ 'dryRun' ] === undefined) {
      this.options[ 'dry-run' ] = false;
    } else {
      this.options['dry-run'] = this.options['dryRun'];
      delete(this.options['dryRun']);
    }
    return new Schematic(
      this.collectionName,
      this.schematicName,
      this.args,
      this.options
    );
  }
}

class Schematic {
  constructor(collectionName, schematicName, args, options) {
    this.collectionName = collectionName;
    this.schematicName = schematicName;
    this.args = args;
    this.options = options;
  }

  command() {
    return path.join(__dirname, '..', 'node_modules/.bin/schematics')
      .concat(' ')
      .concat(path.join(__dirname, '..'))
      .concat(':')
      .concat(this.schematicName)
      .concat(' ')
      .concat(this._buildArgs())
      .concat(this._buildOptions())
  }

  _buildArgs() {
    return Object
      .keys(this.args)
      .reduce((line, key) => {
        return line.concat(`--${ key }=${ this.args[key] } `)
      }, '');
  }

  _buildOptions() {
    return Object
      .keys(this.options)
      .reduce((line, key) => {
        return line.concat(`--${ key }=${ this.options[key] } `)
      }, '');
  }

  static Builder() {
    return new SchematicBuilder();
  }
}

module.exports = Schematic;
