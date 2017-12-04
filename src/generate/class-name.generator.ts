import { StringUtils } from '../utils/string.utils';
import * as path from 'path';

export class ClassNameGenerator {
  constructor() {}

  public generate(type: string, name: string): any {
    return `${ StringUtils.capitalize(this.extract(name)) }${ StringUtils.capitalize(type) }`;
  }

  private extract(name: string): string {
    if (name.indexOf(path.sep)) {
      return name.split(path.sep).pop();
    } else {
      return name;
    }
  }
}