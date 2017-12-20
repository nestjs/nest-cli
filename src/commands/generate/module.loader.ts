import { Asset } from './asset';
import * as path from 'path';
import * as fs from 'fs';

export class ModuleLoader {
  constructor() {}

  public async load(asset: Asset): Promise<Asset> {
    const files: string[] = await this.readAssetDirectory(asset.directory);
    const filename: string = files.find((filename) => filename.indexOf('module') !== -1);
    const content: string = await this.getModuleContent(path.join(asset.directory, filename));
    return {
      type: 'module',
      name: asset.name,
      template: {
        name: '',
        content: content
      },
      directory: asset.directory,
      filename: filename
    };
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
        resolve(files);
      });
    });
  }
}