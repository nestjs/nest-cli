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
import {ModuleFinderImpl} from '../module-finders/module.finder';
import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';

export class ComponentProcessor implements Processor{
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
        return this.generate(assets)
          .then(() => this.updateModule(moduleFilename, assets));
      });
  }

  private buildAssets(moduleFilename: string): Asset[] {
    const assets: Asset[] = [];
    const className: string = this.buildClassName();
    const filename: string = this.buildFilename();
    assets.push(this.buildClassAsset(className, filename, moduleFilename));
    assets.push(this.buildTestAsset(className, filename, moduleFilename));
    return assets
  }

  private buildClassName() {
    return new ClassNameBuilder()
      .addName(this._name)
      .addAsset(AssetEnum.COMPONENT)
      .build();
  }

  private buildFilename() {
    return new FileNameBuilder()
      .addAsset(AssetEnum.COMPONENT)
      .addName(this._name)
      .addExtension(this._extension)
      .addTest(false)
      .build();
  }

  private buildClassAsset(className: string, filename: string, moduleFilename: string): Asset {
    return new AssetBuilder()
      .addType(AssetEnum.COMPONENT)
      .addClassName(className)
      .addFilename(this.buildClassAssetFilename(filename, moduleFilename))
      .addTemplate(this.buildClassAssetTemplate(filename, className))
      .build();
  }

  private buildClassAssetFilename(filename: string, moduleName: string) {
    return path.join(
      process.cwd(),
      path.dirname(moduleName),
      'services',
      filename
    );
  }

  private buildClassAssetTemplate(filename: string, className: string) {
    return new TemplateBuilder()
      .addFilename(path.resolve(__dirname, `../../../assets/${ this._extension }/component/component.${ this._extension }.template`))
      .addReplacer({
        __CLASS_NAME__: className,
        __DIR_NAME__: `'./services/${ filename }'`
      })
      .build();
  }

  private buildTestAsset(className: string, filename: string, moduleFilename: string): Asset {
    return new AssetBuilder()
      .addType(AssetEnum.COMPONENT)
      .addClassName(className)
      .addFilename(this.buildTestAssetFilename(moduleFilename))
      .addTemplate(this.buildTestAssetTemplate(className, filename))
      .build();
  }

  private buildTestAssetFilename(moduleFilename: string) {
    return path.join(
      process.cwd(),
      path.dirname(moduleFilename),
      'services',
      new FileNameBuilder()
        .addAsset(AssetEnum.COMPONENT)
        .addName(this._name)
        .addExtension(this._extension)
        .addTest(true)
        .build()
    );
  }

  private buildTestAssetTemplate(className: string, filename: string) {
    return new TemplateBuilder()
      .addFilename(path.resolve(__dirname, `../../../assets/${ this._extension }/component/component.spec.${ this._extension }.template`))
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

  private updateModule(moduleFilename: string, assets: Asset[]): Promise<void> {
    return this._updater.updateV2(path.join(process.cwd(), moduleFilename), assets[0]);
  }
}
