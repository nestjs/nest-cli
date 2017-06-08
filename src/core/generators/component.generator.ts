import {AssetEnum} from '../../common/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {ComponentAsset, TestComponentAsset} from '../assets/component.asset.interface';
import {AbstractAssetGenerator} from './abstract-asset.generator';
import {ModuleUpdater} from '../../common/interfaces/module.updater.interface';
import {ComponentUpdater} from '../module-updaters/component.updater';

export class ComponentGenerator extends AbstractAssetGenerator {
  private templatePath: string = '../../assets/ts/component/component.ts.template';
  private testTemplatePath: string = '../../assets/ts/component/component.spec.ts.template';
  private updater: ModuleUpdater = new ComponentUpdater();

  private FILE_EXTENSION: string = 'ts';

  public generate(name: string): Promise<void> {
    this.generateTestAsset(name);
    return this.generateAsset(name);
  }

  private generateAsset(name: string): Promise<void> {
    const filename: string = new FileNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).addExtension(this.FILE_EXTENSION).build();
    const className: string = new ClassNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).build();
    const asset: ComponentAsset = {
      path: name,
      filename: filename,
      replacer: {
        __CLASS_NAME__: className,
      }
    };
    this.copy(asset, this.templatePath);
    return this.updater.update(filename, className);
  }

  private generateTestAsset(name: string): void {
    const asset: TestComponentAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).addTest(true).addExtension(this.FILE_EXTENSION).build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).build(),
        __IMPORT__: new FileNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).addExtension(this.FILE_EXTENSION).build()
      }
    };
    this.copy(asset, this.testTemplatePath);
  }
}
