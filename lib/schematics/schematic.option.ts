import { strings } from '@angular-devkit/core';

export class SchematicOption {
  constructor(private name: string, private value: boolean | string) {}

  public toCommandString(): string {
    if (typeof this.value === 'string') {
      return `--${ strings.dasherize(this.name) }=${ this.format() }`;
    } else {
      return `--${ strings.dasherize(this.name) }=${ this.value }`;
    }
  }

  private format(): string {
    return strings
      .dasherize(this.value as string)
      .split('')
      .reduce((content, char) => {
        if (char === '(' || char === ')' || char === '[' || char === ']') {
          return `${ content }\\${ char }`;
        } else {
          return `${ content }${ char }`;
        }
      }, '');
  }
}
