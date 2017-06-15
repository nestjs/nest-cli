import * as path from 'path';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {ModuleAsset} from '../interfaces/module.asset.interface';
import {AbstractAssetGenerator} from './abstract-asset.generator';

export class ModuleGenerator extends AbstractAssetGenerator {
  private templatePath: string = path.resolve(__dirname, '../../../assets/ts/module/module.ts.template');

  public generate(name: string): Promise<void> {
    const asset: ModuleAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.MODULE).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.MODULE).build()
      }
    };
    this.copy(asset, this.templatePath);
    return Promise.resolve();
  }

}
