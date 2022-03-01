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
      const str = this.dasherize(this.name);
      return this.value ? `--${str}` : `--no-${str}`;
    } else {
      return `--${this.dasherize(this.name)}=${this.value}`;
    }
  }

  private format() {
    return this.dasherize(this.value as string)
      .split('')
      .reduce((content, char) => {
        if (char === '(' || char === ')' || char === '[' || char === ']') {
          return `${content}\\${char}`;
        }
        return `${content}${char}`;
      }, '');
  }

  private dasherize(str: string) {
    const STRING_DASHERIZE_REGEXP = /[\s]/g;
    const STRING_DECAMELIZE_REGEXP = /([a-z\d])([A-Z])/g;
    return str
      .replace(STRING_DECAMELIZE_REGEXP, '$1-$2')
      .toLowerCase()
      .replace(STRING_DASHERIZE_REGEXP, '-');
  }
}
