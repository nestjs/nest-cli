import * as path from 'path';

export class FileNameGenerator {
  constructor() {}

  public generate(type: string, name: string): string {
    return `${ this.extract(name) }.${ type }`;
  }

  private extract(name: string) {
    if (name.indexOf(path.sep) !== -1) {
      return name.split(path.sep).pop();
    } else {
      return name;
    }
  }
}