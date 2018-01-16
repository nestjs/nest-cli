import { Asset } from './asset';
import * as path from 'path';
import * as fs from 'fs';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';

export class AssetEmitter {
  constructor(
    private logger: Logger = LoggerService.getLogger()
  ) {}

  public async emit(asset: Asset) {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'emit asset', JSON.stringify(asset, null, 2));
    if (!await this.isDirectory(asset.directory)) {
      await this.createDirectory(asset.directory);
    }
    await this.emitFile(asset);
  }

  private async isDirectory(folder: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      fs.stat(folder, (error: NodeJS.ErrnoException, stats: fs.Stats) => {
        resolve(!this.isError(error) && stats.isDirectory());
      });
    });
  }

  private isError(error: NodeJS.ErrnoException) {
    return error !== undefined && error !== null;
  }

  private async createDirectory(folder: string) {
    return new Promise((resolve) => {
      fs.mkdir(folder, () => {
        resolve();
      });
    });
  }

  private async emitFile(asset: Asset) {
    return new Promise((resolve, reject) => {
      const filename: string = path.join(asset.directory, asset.filename);
      fs.writeFile(filename, asset.template.content, (error: NodeJS.ErrnoException) => {
        if (error !== undefined && error !== null) {
          return reject(error);
        } else {
          this.logger.info(ColorService.green('create'), filename);
          return resolve();
        }
      });
    });
  }
}