import { Asset } from './asset';
import * as path from 'path';

export class ModuleImportRegister {
  constructor() {}

  public register(asset: Asset, module: Asset): Asset {
    const lines = module.template.content.split('\n');
    const insertIndex: number = lines.findIndex((line) => line === '');
    const toInsert: string = this.buildLineToInsert(asset, module);
    lines.splice(insertIndex, 0, toInsert);
    module.template.content = lines.join('\n');
    return module;
  }

  private buildLineToInsert(asset: Asset, module: Asset): string {
    return `import { ${ asset.className } } from './${ this.removeExtension(asset.filename) }';`;
  }

  private removeExtension(filename: string) {
    return filename.replace(/.(js|ts)/, '');
  }
}