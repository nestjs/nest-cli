import * as path from 'path';

export class FileNameBuilder {
  constructor() {}

  public buildFrom(type: string, name: string): string {
    return `${ this.extract(name) }.${ type }`;
  }

  private extract(name: string) {
    if (name.indexOf(path.sep)) {
      return name.split(path.sep).pop();
    } else {
      return name;
    }
  }
}