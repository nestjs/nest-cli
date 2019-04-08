import { strings } from '@angular-devkit/core';

export class SchematicOption {
  constructor(private name: string, private value: boolean | string) {}

  public toCommandString(): string {
    if (typeof this.value === 'string') {
      if (this.name === 'name') {
        return `--${this.name}=${this.format()}`;
      } else if (this.name === 'version' || this.name === 'path') {
        return `--${this.name}=${this.value}`;
      } else {
        return `--${this.name}="${this.value}"`;
      }
    } else if (typeof this.value === 'boolean') {
      const str = strings.dasherize(this.name);
      return this.value ? `--${str}` : `--no-${str}`;
    } else {
      return `--${strings.dasherize(this.name)}=${this.value}`;
    }
  }

  private format() {
    return strings
      .dasherize(this.value as string)
      .split('')
      .reduce((content, char) => {
        if (char === '(' || char === ')' || char === '[' || char === ']') {
          return `${content}\\${char}`;
        }
        return `${content}${char}`;
      }, '');
  }
}
