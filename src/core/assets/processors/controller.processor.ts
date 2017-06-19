import {Processor} from '../../../common/asset/interfaces/processor.interface';
import * as path from 'path';
import {TemplateBuilder} from '../builders/template.builder';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {AssetBuilder} from '../builders/asset.builder';
import {Asset} from '../../../common/asset/interfaces/asset.interface';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {AssetGenerator} from '../generators/asset.generator';
import {Generator} from '../../../common/asset/interfaces/generator.interface';
import {ControllerUpdater} from '../module-updaters/controller.updater';
import {ModuleUpdater} from '../../../common/asset/interfaces/module.updater.interface';

export class ControllerProcessor implements Processor {
  private _generator: Generator;
  private _updater: ModuleUpdater;
  private _assets: Asset[];

  constructor(private _name: string) {
    this._generator = new AssetGenerator();
    this._updater = new ControllerUpdater();
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
      .addAsset(AssetEnum.CONTROLLER)
      .build();
    const filename: string = new FileNameBuilder()
      .addAsset(AssetEnum.CONTROLLER)
      .addName(this._name)
      .addExtension('ts')
      .addTest(false)
      .build();
    this._assets.push(this.buildClassAsset(className, filename));
    this._assets.push(this.buildTestAsset(className, filename));
  }

  private buildClassAsset(className: string, filename: string): Asset {
    return new AssetBuilder()
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
          .addFilename(path.resolve(__dirname, '../../../assets/ts/controller/controller.ts.template'))
          .addReplacer({
            __CLASS_NAME__: className
          })
          .build()
      )
      .build();
  }

  private buildTestAsset(className: string, filename: string): Asset {
    return new AssetBuilder()
      .addClassName(className)
      .addFilename(
        path.join(
          process.cwd(),
          'src/app/modules',
          this._name,
          new FileNameBuilder()
            .addAsset(AssetEnum.CONTROLLER)
            .addName(this._name)
            .addExtension('ts')
            .addTest(true)
            .build()
        )
      )
      .addTemplate(
        new TemplateBuilder()
          .addFilename(path.resolve(__dirname, '../../../assets/ts/controller/controller.spec.ts.template'))
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
    return this._updater.update(this._assets[0].filename, this._assets[0].className);
  }
}
