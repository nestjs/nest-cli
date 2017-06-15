import {ClassNameBuilder} from '../builders/class-name.builder';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {ControllerAsset, TestControllerAsset} from '../interfaces/controller.asset.interface';
import {AbstractAssetGenerator} from './abstract-asset.generator';
import {ModuleUpdater} from '../../../common/asset/interfaces/module.updater.interface';
import {ControllerUpdater} from '../module-updaters/controller.updater';
import * as path from 'path';

export class ControllerGenerator extends AbstractAssetGenerator {
  private templatePath: string = '../../assets/ts/controller/controller.ts.template';
  private testTemplatePath: string = '../../assets/ts/controller/controller.spec.ts.template';
  private updater: ModuleUpdater = new ControllerUpdater();

  public generate(name: string): Promise<void> {
    this.generateTestAsset(name);
    return this.generateAsset(name);
  }

  private generateAsset(name: string): Promise<void> {
    const filename: string = new FileNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).addExtension('ts').build();
    const className: string = new ClassNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).build();
    const asset: ControllerAsset = {
      path: name,
      filename: filename,
      replacer: {
        __CLASS_NAME__: className,
        __URI_PATH__: ''
      }
    };
    this.copy(asset, this.templatePath);
    return this.updater.update(path.resolve(process.cwd(), asset.path, asset.filename), className);
  }

  private generateTestAsset(name: string): void {
    const asset: TestControllerAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).addTest(true).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).build(),
        __IMPORT__: new FileNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).addExtension('ts').build(),
      }
    };
    this.copy(asset, this.testTemplatePath);
  }
}
