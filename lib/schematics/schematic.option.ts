import { normalizeToKebabOrSnakeCase } from '../utils/formatting';

export class SchematicOption {
  constructor(
    private name: string,
    private value: boolean | string,
    private keepInputNameFormat: boolean = false,
  ) {}

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
      const str = this.keepInputNameFormat
        ? this.name
        : normalizeToKebabOrSnakeCase(this.name);
      return this.value ? `--${str}` : `--no-${str}`;
    } else {
      return `--${normalizeToKebabOrSnakeCase(this.name)}=${this.value}`;
    }
  }

  private format() {
    return normalizeToKebabOrSnakeCase(this.value as string)
      .split('')
      .reduce((content, char) => {
        if (char === '(' || char === ')' || char === '[' || char === ']') {
          return `${content}\\${char}`;
        }
        return `${content}${char}`;
      }, '');
  }
}
