const { strings } = require('@angular-devkit/core');

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

module.exports = { SchematicOption };