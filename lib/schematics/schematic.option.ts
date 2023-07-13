import { normalizeToKebabOrSnakeCase, normalizeFileName } from '../utils/formatting';

export class SchematicOption {
  constructor(private name: string, private value: boolean | string, private fileNameCase: string) {}

  get normalizedName() {
    return normalizeToKebabOrSnakeCase(this.name);
  }

  public toCommandString(): string {
    if (typeof this.value === 'string') {
      if (this.name === 'name') {
        return `--${this.normalizedName}=${this.format()}`;
      } else if (this.name === 'version' || this.name === 'path') {
        return `--${this.normalizedName}=${this.value}`;
      } else {
        return `--${this.normalizedName}="${this.value}"`;
      }
    } else if (typeof this.value === 'boolean') {
      const str = this.normalizedName;
      return this.value ? `--${str}` : `--no-${str}`;
    } else {
      return `--${this.normalizedName}=${this.value}`;
    }
  }

  private format() {
    const tmpFileName = normalizeFileName(this.value as string, this.fileNameCase)
    const formattedFileName = tmpFileName
      .split('')
      .reduce((content, char) => {
        if (char === '(' || char === ')' || char === '[' || char === ']') {
          return `${content}\\${char}`;
        }
        return `${content}${char}`;
      }, '');

    console.log({ formattedFileName, tmpFileName })

    return formattedFileName;
  }
}
