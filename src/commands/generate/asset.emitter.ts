import { Asset } from './asset';
import * as path from 'path';
import * as fs from 'fs';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';

export class AssetEmitter {
  constructor(private logger: Logger = LoggerService.getLogger()) {
  }

  public async emit(asset: Asset) {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ AssetEmitter.name }::emit() -`, `asset : ${ JSON.stringify(asset, null, 2) }`);
    await this.createRecursiveDirectory(asset.directory);
    await this.emitFile(asset);
  }

  private async isDirectory(folder: string): Promise<boolean> {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ AssetEmitter.name }::isDirectory() -`, `folder : ${ folder }`);
    return new Promise<boolean>((resolve) => {
      fs.stat(folder, (error: NodeJS.ErrnoException, stats: fs.Stats) => {
        resolve(!this.isError(error) && stats.isDirectory());
      });
    });
  }

  private isError(error: NodeJS.ErrnoException) {
    return error !== undefined && error !== null;
  }

  private async createRecursiveDirectory(folder: string): Promise<string> {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ AssetEmitter.name }::createRecursiveDirectory() -`, `folder : ${ folder }`);
    const segments: string[] = folder.split(path.sep);
    return segments
      .reduce(async (parentPromise: Promise<string>, current: string) => {
        return parentPromise.then(async (parent) => {
          const directory: string = path.join(parent, current);
          if (!await this.isDirectory(directory)) {
            await this.createDirectory(directory);
          }
          return directory;
        })
      }, Promise.resolve(`${ path.sep }${ segments[ 0 ] }`));
  }

  private async createDirectory(folder: string) {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ AssetEmitter.name }::createDirectory() -`, `folder : ${ folder }`);
    return new Promise((resolve, reject) => {
      fs.mkdir(folder, (error: NodeJS.ErrnoException) => {
        if (error !== undefined && error !== null) {
          reject(error);
        }
        resolve();
      });
    });
  }

  private async emitFile(asset: Asset) {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ AssetEmitter.name }::emitFile() -`, `asset : ${ JSON.stringify(asset, null, 2) }`);
    return new Promise((resolve, reject) => {
      const filename: string = path.join(asset.directory, asset.filename);
      fs.writeFile(filename, asset.template.content, (error: NodeJS.ErrnoException) => {
        if (error !== undefined && error !== null) {
          return reject(error);
        } else {
          this.logger.info(ColorService.green(' create'), filename);
          return resolve();
        }
      });
    });
  }
}