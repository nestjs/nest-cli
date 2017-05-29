import {AssetEnum} from '../../common/enums/asset.enum';
import {Generator} from '../../common/interfaces/generator.interface';
import {ModuleGenerator} from './module.generator';
import {ControllerGenerator} from './controller.generator';
import {ComponentGenerator} from './component.generator';
import * as fs from 'fs';

export class AssetGenerator implements Generator {
  private module: Generator = new ModuleGenerator();
  private controller: Generator = new ControllerGenerator();
  private component: Generator = new ComponentGenerator();

  constructor(private _asset: AssetEnum) {}

  public generate(name: string): Promise<void> {
    return this.generateAssetFolderStructure(name)
      .then(() => this.generateAssetFiles(name))
  }

  private generateAssetFolderStructure(name: string): Promise<void> {
    return new Promise<void>(resolve => {
      fs.mkdir(name, error => {
        console.log(error);
        resolve();
      });
    });
  }

  private generateAssetFiles(name: string) {
    switch (this._asset) {
      case AssetEnum.MODULE:
        return this.module.generate(name);
      case AssetEnum.CONTROLLER:
        return this.controller.generate(name);
      case AssetEnum.COMPONENT:
        return this.component.generate(name);
    }
  }
}
