import {ModuleUpdater} from '../../../common/asset/interfaces/module.updater.interface';
import {LoggerService} from '../../logger/logger.service';
import {Logger} from '../../../common/logger/interfaces/logger.interface';
import * as path from 'path';
import {ColorService} from '../../logger/color.service';
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as fs from 'fs';
import {Asset} from '../../../common/asset/interfaces/asset.interface';
import {ImportTransform} from '../streams/import.transform';
import {ReplaceTransform} from '../streams/replace.transform';
import {MetadataTransform} from '../streams/metadata.transform';

export class ModuleUpdaterImpl implements ModuleUpdater {
  private _logger: Logger = LoggerService.getLogger();

  public update(moduleFilename: string, asset: Asset): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const reader: fs.ReadStream = fs.createReadStream(moduleFilename);
      const intermediateWriter: fs.WriteStream = fs.createWriteStream(`${ moduleFilename }.lock`);
      reader
        .pipe(new ImportTransform())
        .pipe(new MetadataTransform(asset.type))
        .pipe(new ReplaceTransform(asset.template.replacer))
        .pipe(intermediateWriter);
      reader
        .on('end', () => {
          const intermediateReader: fs.ReadStream = fs.createReadStream(`${ moduleFilename }.lock`);
          const writer: fs.WriteStream = fs.createWriteStream(moduleFilename);
          intermediateReader
            .pipe(writer);
          intermediateReader
            .on('end', () => {
              FileSystemUtils.rm(`${ moduleFilename }.lock`)
                .then(() => this._logger.info(ColorService.yellow('update'), `${ path.relative(process.cwd(), moduleFilename) }`))
                .then(() => resolve())
                .catch(error => reject(error));
            });
        });
    });
  }
}
