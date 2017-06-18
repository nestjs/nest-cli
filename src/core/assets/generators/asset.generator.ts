import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {Generator} from '../../../common/asset/interfaces/generator.interface';
import {ModuleGenerator} from './module.generator';
import {ControllerGenerator} from './controller.generator';
import {ComponentGenerator} from './component.generator';
import {FileSystemUtils} from '../../utils/file-system.utils';
import {Asset} from '../../../common/asset/interfaces/asset.interface';
import * as fs from 'fs';
import {ReadStream, WriteStream} from 'fs';
import {ReplaceTransform} from '../streams/replace.transform';

export class AssetGenerator implements Generator {
  private module: Generator = new ModuleGenerator();
  private controller: Generator = new ControllerGenerator();
  private component: Generator = new ComponentGenerator();

  constructor(private _asset?: AssetEnum) {}

  public generateFrom(name: string): Promise<void> {
    return FileSystemUtils.mkdir(name)
      .then(() => this.generateAssetFiles(name))
  }

  public generate(asset: Asset): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const reader: ReadStream = fs.createReadStream(asset.template.filename);
      const writer: WriteStream = fs.createWriteStream(asset.filename);
      reader
        .pipe(new ReplaceTransform(asset.template.replacer))
        .pipe(writer);
      reader.on('end', resolve);
      reader.on('error', reject);
    });
  }

  private generateAssetFiles(name: string) {
    switch (this._asset) {
      case AssetEnum.MODULE:
        return this.module.generateFrom(name);
      case AssetEnum.CONTROLLER:
        return this.controller.generateFrom(name);
      case AssetEnum.COMPONENT:
        return this.component.generateFrom(name);
    }
  }
}
