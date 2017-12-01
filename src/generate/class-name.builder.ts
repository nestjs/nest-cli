import { StringUtils } from './string.utils';
import * as path from 'path';

export class ClassNameBuilder {
  constructor() {}

  public buildFrom(type: string, name: string): any {
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