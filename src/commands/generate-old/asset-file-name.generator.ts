import * as path from 'path';
import { Asset } from './asset';

export class AssetFileNameGenerator {
  constructor() {}

  public generate(asset: Asset): string {
    return `${ this.extractName(asset.name) }.${ asset.type }${ this.addSpec(asset.template.name)}${ this.extractLanguage(asset.template.name)}`;
  }

  private extractName(name: string) {
    if (name.indexOf(path.sep) !== -1) {
      return name.split(path.sep).pop();
    } else {
      return name;
    }
  }

  private addSpec(name: string): string {
    return name.indexOf('spec') !== -1 ? '.spec.' : '.';
  }

  private extractLanguage(name: string) {
    return name.indexOf('ts') !== -1 ? 'ts' : 'js';
  }
}