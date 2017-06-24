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
import {ModuleUpdater} from '../../../common/asset/interfaces/module.updater.interface';
import {ModuleUpdaterImpl} from '../module-updaters/module.updater';
import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../module-finders/module.finder';

export class ControllerProcessor implements Processor {
  private _finder: ModuleFinder;
  private _generator: Generator;
  private _updater: ModuleUpdater;

  constructor(
    private _name: string,
    private _moduleName: string,
    private _extension: string
  ) {
    this._finder = new ModuleFinderImpl();
    this._generator = new AssetGenerator();
    this._updater = new ModuleUpdaterImpl();
  }

  public process(): Promise<void> {
    return this._finder.find(this._moduleName)
      .then(moduleFilename => {
        const assets: Asset[] = this.buildAssets(moduleFilename);
        return this.generate(assets);
      });
  }

  private buildAssets(moduleFilename: string): Asset[] {
    const assets: Asset[] = [];
    const className: string = this.buildClassName();
    const filename: string = this.buildFileName();
    assets.push(this.buildClassAsset(className, filename, moduleFilename));
    assets.push(this.buildTestAsset(className, filename, moduleFilename));
    return assets;
  }

  private buildClassName() {
    return new ClassNameBuilder()
      .addName(this._name)
      .addAsset(AssetEnum.CONTROLLER)
      .build();
  }

  private buildFileName() {
    return new FileNameBuilder()
      .addAsset(AssetEnum.CONTROLLER)
      .addName(this._name)
      .addExtension(this._extension)
      .addTest(false)
      .build();
  }

  private buildClassAsset(className: string, filename: string, moduleFilename: string): Asset {
    return new AssetBuilder()
      .addClassName(className)
      .addFilename(this.buildClassAssetFileName(filename, moduleFilename))
      .addTemplate(this.buildClassAssetTemplate(className))
      .build();
  }

  private buildClassAssetFileName(filename: string, moduleFilename: string) {
    return path.join(
      process.cwd(),
      path.dirname(moduleFilename),
      'controllers',
      filename
    );
  }

  private buildClassAssetTemplate(className: string) {
    return new TemplateBuilder()
      .addFilename(path.resolve(__dirname, `../../../assets/${ this._extension }/controller/controller.${ this._extension }.template`))
      .addReplacer({
        __CLASS_NAME__: className
      })
      .build();
  }

  private buildTestAsset(className: string, filename: string, moduleFilename: string): Asset {
    return new AssetBuilder()
      .addClassName(className)
      .addFilename(this.buildTestAssetFileName(moduleFilename))
      .addTemplate(this.buildTestAssetTemplate(className, filename))
      .build();
  }

  private buildTestAssetFileName(moduleFilename: string) {
    return path.join(
      process.cwd(),
      path.dirname(moduleFilename),
      'controllers',
      new FileNameBuilder()
        .addAsset(AssetEnum.CONTROLLER)
        .addName(this._name)
        .addExtension(this._extension)
        .addTest(true)
        .build()
    );
  }

  private buildTestAssetTemplate(className: string, filename: string) {
    return new TemplateBuilder()
      .addFilename(path.resolve(__dirname, `../../../assets/${ this._extension }/controller/controller.spec.${ this._extension }.template`))
      .addReplacer({
        __CLASS_NAME__: className,
        __IMPORT__: filename
      })
      .build();
  }

  private generate(assets: Asset[]): Promise<void> {
    return this._generator.generate(assets[0])
      .then(() => this._generator.generate(assets[1]));
  }

  private updateModule(assets: Asset[]): Promise<void> {
    return this._updater.update(assets[0].filename, assets[0].className, AssetEnum.CONTROLLER);
  }
}
