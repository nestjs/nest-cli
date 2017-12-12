import { Asset } from './asset.generator';
import * as path from 'path';
import * as fs from 'fs';

export class AssetModuleLoader {
  constructor() {}

  public async load(asset: Asset): Promise<Asset> {
    const dirname: string = path.dirname(asset.path);
    const files: string[] = await this.readAssetDirectory(dirname);
    const moduleFilename: string = files.find((filename) => filename.indexOf('module') !== -1);
    const content: string = await this.getModuleContent(moduleFilename);
    asset.module = {
      path: moduleFilename,
      template: {
        content: content
      }
    };
    return asset;
  }

  private async getModuleContent(moduleFilename: string): Promise<string> {
    return new Promise<string>((resolve) => {
      fs.readFile(moduleFilename, (error: NodeJS.ErrnoException, buffer: Buffer) => {
        resolve(buffer.toString());
      });
    });
  }

  private async readAssetDirectory(dirname: string): Promise<string[]> {
    return new Promise<string[]>((resolve) => {
      fs.readdir(dirname, (error: NodeJS.ErrnoException, files: string[]) => {
        resolve(files.map((filename) => path.join(dirname, filename)));
      });
    });
  }
}