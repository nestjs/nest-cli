import {ClassNameBuilder} from '../builders/class-name.builder';
import {AssetEnum} from '../../common/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {ControllerAsset, TestControllerAsset} from '../assets/controller.asset.interface';
import {AbstractAssetGenerator} from './abstract-asset.generator';

export class ControllerGenerator extends AbstractAssetGenerator {
  private templatePath: string = '../../assets/ts/controller/controller.ts.template';
  private testTemplatePath: string = '../../assets/ts/controller/controller.spec.ts.template';

  public generate(name: string): Promise<void> {
    this.generateAsset(name);
    this.generateTestAsset(name);
    return Promise.resolve();
  }

  private generateAsset(name: string): void {
    const asset: ControllerAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).build(),
        __URI_PATH__: ''
      }
    };
    this.copy(asset, this.templatePath);
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
