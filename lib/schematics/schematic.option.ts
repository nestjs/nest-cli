import { normalizeToCase, formatString, CaseType } from '../utils/formatting';

export type SchematicOptionConfig = {
  caseType?: CaseType;
};

export class SchematicOption {
  constructor(
    private name: string,
    private value: boolean | string,
    private schematicOptionConfig: SchematicOptionConfig,
  ) {}

  get normalizedName() {
    return normalizeToCase(this.name, 'kebab-or-snake');
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
        this.schematicOptionConfig.caseType || 'kebab-or-snake',
      ),
    );
  }
}
