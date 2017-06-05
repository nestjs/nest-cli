import {AssetEnum} from '../../common/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {ComponentAsset, TestComponentAsset} from '../assets/component.asset.interface';
import {AbstractAssetGenerator} from './abstract-asset.generator';

export class ComponentGenerator extends AbstractAssetGenerator {
  private templatePath: string = '../../assets/ts/component/component.ts.template';
  private testTemplatePath: string = '../../assets/ts/component/component.spec.ts.template';

  public generate(name: string): Promise<void> {
    this.generateAsset(name);
    this.generateTestAsset(name);
    return Promise.resolve();
  }

  private generateAsset(name: string): void {
    const asset: ComponentAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).build(),
      }
    };
    this.copy(asset, this.templatePath);
  }

  private generateTestAsset(name: string): void {
    const asset: TestComponentAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).addTest(true).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).build(),
        __IMPORT__: new FileNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).addExtension('ts').build()
      }
    };
    this.copy(asset, this.testTemplatePath);
  }
}
