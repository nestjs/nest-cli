import {ModuleUpdater} from '../../common/interfaces/module.updater.interface';
import {ModuleFinder} from '../../common/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../module-finders/module.finder';
import * as fs from 'fs';
import {ImportTransform} from '../streams/import.transform';
import {MetadataTransform} from '../streams/metadata.transform';
import {AssetEnum} from '../../common/enums/asset.enum';
import {PathUtils} from '../utils/path.utils';

export class ComponentUpdater implements ModuleUpdater {
  private finder: ModuleFinder = new ModuleFinderImpl();

  constructor() {}

  public update(filename: string, className: string): Promise<void> {
    return this.finder.findFrom(filename)
      .then(moduleFilename => {
        const relativeAssetModuleFilename = PathUtils.relative(moduleFilename, filename);
        const reader: fs.ReadStream = fs.createReadStream(moduleFilename);
        const writer: fs.WriteStream = fs.createWriteStream(moduleFilename);
        reader
          .pipe(new ImportTransform(className, relativeAssetModuleFilename))
          .pipe(new MetadataTransform(className, AssetEnum.COMPONENT))
          .pipe(writer);
      });
  }
}
