import { Asset } from './asset.generator';
import * as path from 'path';
import * as fs from 'fs';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';

export class AssetEmitter {
  private ROOT_PATH = 'src/modules';

  constructor(
    private logger: Logger = LoggerService.getLogger()
  ) {}

  public async emit(name: string, assets: Asset[]) {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'emit assets', name, JSON.stringify(assets, null, 2));
    const folder: string = path.join(process.cwd(), this.ROOT_PATH, name);
    if (!await this.isDirectory(folder)) {
      await this.createDirectory(folder);
    }
    await assets.forEach(async (asset) => await this.emitFile(folder, asset));
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

  private async emitFile(folder: string, asset: Asset) {
    return new Promise((resolve, reject) => {
      const filename: string = path.join(folder, asset.path);
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