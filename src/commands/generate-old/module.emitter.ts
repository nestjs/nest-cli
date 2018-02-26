import { Asset } from './asset';
import * as fs from 'fs';
import * as path from 'path';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';

export class ModuleEmitter {
  constructor(
    private logger: Logger = LoggerService.getLogger()
  ) {}

  public async emit(module: Asset) {
    return new Promise((resolve) => {
      const filename: string = path.join(module.directory, module.filename);
      fs.writeFile(filename, module.template.content, (error: NodeJS.ErrnoException) => {
        this.logger.info(ColorService.yellow(' update'), filename);
        resolve();
      });
    });
  }
}