import { normalizeToCase, formatString } from '../utils/formatting';

export class SchematicOption {
  constructor(
    private name: string,
    private value: boolean | string,
  ) {}

  get normalizedName() {
    return normalizeToCase(this.name, 'kebab');
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
    return formatString(
      normalizeToCase(
        this.value as string,
        'kebab',
      ),
    );
  }
}
