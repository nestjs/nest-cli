import { strings }from '@angular-devkit/core';

export class SchematicOption {
  constructor(private name, private value) {}

  public toCommandString() {
    if (typeof this.value === 'string') {
      return `--${ strings.dasherize(this.name) }=${ strings.dasherize(this.value) }`;
    } else {
      return `--${ strings.dasherize(this.name) }=${ this.value }`;
    }
  }
}
