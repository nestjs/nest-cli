import {ModuleUpdater} from '../../../common/asset/interfaces/module.updater.interface';
import {LoggerService} from '../../logger/logger.service';
import {Logger} from '../../../common/logger/interfaces/logger.interface';
import {ModuleFinderImpl} from '../module-finders/module.finder';
import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';
import * as path from 'path';
import {ColorService} from '../../logger/color.service';
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as fs from 'fs';
import {MetadataTransform} from '../streams/metadata.transform';
import {ImportTransform} from '../streams/import.transform';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {PathUtils} from '../../utils/path.utils';
import {Asset} from '../../../common/asset/interfaces/asset.interface';
import {ImportTransformV2} from '../streams/importV2.transform';
import {ReplaceTransform} from '../streams/replace.transform';
import {MetadataTransformV2} from '../streams/metadataV2.transform';

export class ModuleUpdaterImpl implements ModuleUpdater {
  private _finder: ModuleFinder = new ModuleFinderImpl();
  private _logger: Logger = LoggerService.getLogger();

  public updateV1(filename: string, className: string, asset: AssetEnum): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._finder.findFrom(filename)
        .then(moduleFilename => {
          const relativeAssetModuleFilename = PathUtils.relative(moduleFilename, filename);
          const reader: fs.ReadStream = fs.createReadStream(moduleFilename);
          const intermediateWriter: fs.WriteStream = fs.createWriteStream(`${ moduleFilename }.lock`);
          reader
            .pipe(new ImportTransform(className, relativeAssetModuleFilename))
            .pipe(new MetadataTransform(className, asset))
            .pipe(intermediateWriter);
          reader.on('end', () => {
            const intermediateReader: fs.ReadStream = fs.createReadStream(`${ moduleFilename }.lock`);
            const writer: fs.WriteStream = fs.createWriteStream(moduleFilename);
            intermediateReader.pipe(writer);
            intermediateReader.on('end', () => {
              FileSystemUtils.rm(`${ moduleFilename }.lock`)
                .then(() => this._logger.info(ColorService.yellow('update'), `${ path.relative(process.cwd(), moduleFilename) }`))
                .then(() => resolve())
                .catch(error => reject(error));
            });
          });
        });
    });
  }

  public updateV2(moduleFilename: string, asset: Asset): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const reader: fs.ReadStream = fs.createReadStream(moduleFilename);
      const intermediateWriter: fs.WriteStream = fs.createWriteStream(`${ moduleFilename }.lock`);
      reader
        .pipe(new ImportTransformV2())
        .pipe(new MetadataTransformV2(asset.type))
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
