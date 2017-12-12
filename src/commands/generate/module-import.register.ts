import { Asset } from './asset.generator';
import * as path from 'path';

export class ModuleImportRegister {
  constructor() {}

  public register(asset: Asset): Asset {
    const lines = asset.module.template.content.split('\n');
    const insertIndex: number = lines.findIndex((line) => line === '');
    const toInsert: string = this.buildLineToInsert(asset);
    lines.splice(insertIndex, 0, toInsert);
    asset.module.template.content = lines.join('\n');
    return asset;
  }

  private buildLineToInsert(asset: Asset): string {
    const assetPath: string = asset.path;
    const modulePath: string = asset.module.path;
    return `import { ${ asset.className } } from '${ this.computeRelativePath(modulePath, assetPath) }';`;
  }

  private computeRelativePath(modulePath: string, assetPath: string) {
    let pathElements: string[] = path.relative(modulePath, assetPath)
      .replace(/(.ts|.js)/, '')
      .split('');
    pathElements.splice(0, 1);
    return pathElements.join('');
  }
}