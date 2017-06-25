import {Generator} from '../../../common/asset/interfaces/generator.interface';
import {FileSystemUtils} from '../../utils/file-system.utils';
import {Asset} from '../../../common/asset/interfaces/asset.interface';
import * as fs from 'fs';
import {ReadStream, WriteStream} from 'fs';
import {ReplaceTransform} from '../streams/replace.transform';
import * as path from 'path';
import {Logger} from '../../../common/logger/interfaces/logger.interface';
import {LoggerService} from '../../logger/logger.service';
import {ColorService} from '../../logger/color.service';

export class AssetGenerator implements Generator {
  private _logger: Logger = LoggerService.getLogger();

  constructor() {}

  public generate(asset: Asset): Promise<void> {
    this._logger.debug(ColorService.blue('[DEBUG]'), 'generate asset :', asset);
    const relativeFilename: string = path.relative(process.cwd(), asset.filename);
    return FileSystemUtils.mkdir(path.dirname(relativeFilename))
      .then(() => {
        return new Promise<void>((resolve, reject) => {
          const reader: ReadStream = fs.createReadStream(asset.template.filename);
          const writer: WriteStream = fs.createWriteStream(asset.filename);
          reader
            .pipe(new ReplaceTransform(asset.template.replacer))
            .pipe(writer);
          reader.on('end', resolve);
          reader.on('error', reject);
        });
      })
      .then(() => {
        this._logger.info(ColorService.green('create'), relativeFilename);
      });
  }
}
