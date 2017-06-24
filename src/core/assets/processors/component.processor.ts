import {Processor} from '../../../common/asset/interfaces/processor.interface';
import {Generator} from '../../../common/asset/interfaces/generator.interface';
import {Asset} from '../../../common/asset/interfaces/asset.interface';
import {AssetGenerator} from '../generators/asset.generator';
import * as path from 'path';
import {TemplateBuilder} from '../builders/template.builder';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {AssetBuilder} from '../builders/asset.builder';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {ModuleUpdater} from '../../../common/asset/interfaces/module.updater.interface';
import {ModuleUpdaterImpl} from '../module-updaters/module.updater';

export class ComponentProcessor implements Processor{
  private _generator: Generator;
  private _updater: ModuleUpdater;
  private _assets: Asset[];

  constructor(private _name: string, private _extension: string) {
    this._generator = new AssetGenerator();
    this._updater = new ModuleUpdaterImpl();
    this._assets = [];
  }

  public process(): Promise<void> {
    this.buildAssets();
    return this.generate()
      .then(() => this.updateModule());
  }

  private buildAssets() {
    const className: string = new ClassNameBuilder()
      .addName(this._name)
      .addAsset(AssetEnum.COMPONENT)
      .build();
    const filename: string = new FileNameBuilder()
      .addAsset(AssetEnum.COMPONENT)
      .addName(this._name)
      .addExtension(this._extension)
      .addTest(false)
      .build();
    this._assets.push(this.buildClassAsset(className, filename));
    this._assets.push(this.buildTestAsset(className, filename));
  }

  private buildClassAsset(className: string, filename: string): Asset {
    return new AssetBuilder()
      .addType(AssetEnum.COMPONENT)
      .addClassName(className)
      .addFilename(
        path.join(
          process.cwd(),
          'src/app/modules',
          this._name,
          filename
        )
      )
      .addTemplate(
        new TemplateBuilder()
          .addFilename(path.resolve(__dirname, `../../../assets/${ this._extension }/component/component.${ this._extension }.template`))
          .addReplacer({
            __CLASS_NAME__: className
          })
          .build()
      )
      .build();
  }

  private buildTestAsset(className: string, filename: string): Asset {
    return new AssetBuilder()
      .addType(AssetEnum.COMPONENT)
      .addClassName(className)
      .addFilename(
        path.join(
          process.cwd(),
          'src/app/modules',
          this._name,
          new FileNameBuilder()
            .addAsset(AssetEnum.COMPONENT)
            .addName(this._name)
            .addExtension(this._extension)
            .addTest(true)
            .build()
        )
      )
      .addTemplate(
        new TemplateBuilder()
          .addFilename(path.resolve(__dirname, `../../../assets/${ this._extension }/component/component.spec.${ this._extension }.template`))
          .addReplacer({
            __CLASS_NAME__: className,
            __IMPORT__: filename
          })
          .build()
      )
      .build();
  }

  private generate(): Promise<void> {
    return this._generator.generate(this._assets[0])
      .then(() => this._generator.generate(this._assets[1]));
  }

  private updateModule(): Promise<void> {
    return this._updater.updateV1(this._assets[0].filename, this._assets[0].className, AssetEnum.COMPONENT);
  }
}
