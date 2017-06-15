import * as fs from 'fs';
import {ModuleUpdater} from '../../../common/asset/interfaces/module.updater.interface';
import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../module-finders/module.finder';
import {ImportTransform} from '../streams/import.transform';
import {MetadataTransform} from '../streams/metadata.transform';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {PathUtils} from '../../utils/path.utils';
import {FileSystemUtils} from '../../utils/file-system.utils';
import {Logger} from '../../../common/logger/interfaces/logger.interface';
import {LoggerService} from '../../logger/logger.service';
import {ColorService} from '../../logger/color.service';

export class ComponentUpdater implements ModuleUpdater {
  private finder: ModuleFinder = new ModuleFinderImpl();
  private logger: Logger = LoggerService.getLogger();

  public update(filename: string, className: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.finder.findFrom(filename)
        .then(moduleFilename => {
          const relativeAssetModuleFilename = PathUtils.relative(moduleFilename, filename);
          const reader: fs.ReadStream = fs.createReadStream(moduleFilename);
          const intermediateWriter: fs.WriteStream = fs.createWriteStream(`${ moduleFilename }.lock`);
          reader
            .pipe(new ImportTransform(className, relativeAssetModuleFilename))
            .pipe(new MetadataTransform(className, AssetEnum.COMPONENT))
            .pipe(intermediateWriter);
          reader.on('end', () => {
            const intermediateReader: fs.ReadStream = fs.createReadStream(`${ moduleFilename }.lock`);
            const writer: fs.WriteStream = fs.createWriteStream(moduleFilename);
            intermediateReader.pipe(writer);
            intermediateReader.on('end', () => {
              FileSystemUtils.rm(`${ moduleFilename }.lock`)
                .then(() => this.logger.info(ColorService.yellow('update'), `${ moduleFilename }`))
                .then(() => resolve())
                .catch(error => reject(error));
            });
          });
        });
    });
  }
}
