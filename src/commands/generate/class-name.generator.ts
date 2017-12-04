import * as path from 'path';
import { StringUtils } from '../../utils/string.utils';

export class ClassNameGenerator {
  constructor() {}

  public generate(type: string, name: string): any {
    return `${ StringUtils.capitalize(this.extract(name)) }${ StringUtils.capitalize(type) }`;
  }

  private extract(name: string): string {
    if (name.indexOf(path.sep) !== -1) {
      return name.split(path.sep).pop();
    } else {
      return name;
    }
  }
}