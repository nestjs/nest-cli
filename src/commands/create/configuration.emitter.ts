import * as fs from 'fs';
import * as path from 'path';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';

export class ConfigurationEmitter {
  constructor(
    private logger: Logger = LoggerService.getLogger()
  ) {}

  public async emit(name: string) {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'check if nestconfig.json has to be emit...');
    const filename: string = path.join(process.cwd(), name, 'nestconfig.json');
    this.logger.debug(ColorService.blue('[DEBUG]'), 'filename :', filename);
    const shouldEmitConfigurationFile: boolean = await this.shouldEmitConfigurationFile(filename);
    if (shouldEmitConfigurationFile) {
      await this.writeConfigurationFile(filename);
      this.logger.info(ColorService.green('create'), 'nestconfig.json');
    } else {
      this.logger.debug(ColorService.blue('[DEBUG]'), 'nestconfig.json already exist');
    }
  }

  private async shouldEmitConfigurationFile(filename: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      fs.stat(filename, (error: NodeJS.ErrnoException, stats: fs.Stats) => {
        this.logger.debug(ColorService.blue('[DEBUG]'), 'stat error :', JSON.stringify(error, null, 2));
        this.logger.debug(ColorService.blue('[DEBUG]'), 'file stats :', JSON.stringify(stats, null, 2));
        resolve(this.isError(error));
      });
    });
  }

  private isError(error: NodeJS.ErrnoException): boolean {
    return error !== undefined && error !== null;
  }

  private async writeConfigurationFile(filename: string) {
    return new Promise((resolve, reject) => {
      fs.writeFile(
        filename,
        JSON.stringify({ language: 'ts', entryFile: 'src/server.ts' }, null, 2),
        (error: NodeJS.ErrnoException) => {
          if (error !== undefined && error !== null) {
            return reject(error);
          } else {
            return resolve();
          }
        }
      );
    });
  }
}