import * as path from 'path';
import { StringUtils } from '../../utils/string.utils';
import { Asset } from './asset';

export class AssetClassNameGenerator {
  constructor() {}

  public generate(asset: Asset): string {
    return`${ StringUtils.capitalize(this.extract(asset.name)) }${ StringUtils.capitalize(asset.type) }`;
  }

  private extract(name: string): string {
    if (name.indexOf(path.sep) !== -1) {
      return name.split(path.sep).pop();
    } else {
      return name;
    }
  }
}