import * as fs from 'fs';
import {ModuleUpdater} from '../../common/interfaces/module.updater.interface';
import {ModuleFinder} from '../../common/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../module-finders/module.finder';
import {ImportTransform} from '../streams/import.transform';
import {MetadataTransform} from '../streams/metadata.transform';
import {AssetEnum} from '../../common/enums/asset.enum';
import {PathUtils} from '../utils/path.utils';
import {FileSystemUtils} from '../utils/file-system.utils';

export class ComponentUpdater implements ModuleUpdater {
  private finder: ModuleFinder = new ModuleFinderImpl();

  constructor() {}

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
                .then(() => resolve())
                .catch(error => reject(error));
            });
          });
        });
    });
  }
}
