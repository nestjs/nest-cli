import {Processor} from '../../../common/asset/interfaces/processor.interface';
import {Generator} from '../../../common/asset/interfaces/generator.interface';
import {AssetGenerator} from '../generators/asset.generator';
import {Asset} from '../../../common/asset/interfaces/asset.interface';
import * as path from 'path';
import {TemplateBuilder} from '../builders/template.builder';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {AssetBuilder} from '../builders/asset.builder';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../module-finders/module.finder';
import {Template} from '../../../common/asset/interfaces/template.interface';

export class ModuleProcessor implements Processor {
  private _finder: ModuleFinder;
  private _generator: Generator;

  constructor(
    private _assetName: string,
    private _moduleName: string,
    private _extension: string
  ) {
    this._finder = new ModuleFinderImpl();
    this._generator = new AssetGenerator();
  }

  public process(): Promise<void> {
    return this._finder.find(this._moduleName)
      .then(moduleFilename => {
        const assets = this.buildAssets(moduleFilename);
        return this.generate(assets);
      });
  }

  private buildAssets(moduleFilename: string): Asset[] {
    const assets: Asset[] = [];
    const className: string = this.buildAssetClassName();
    assets.push(this.buildClassAsset(className, moduleFilename));
    return assets;
  }

  private buildAssetClassName(): string {
    return new ClassNameBuilder()
      .addName(this._assetName)
      .addAsset(AssetEnum.MODULE)
      .build();
  }

  private buildClassAsset(className: string, moduleFilename: string): Asset {
    return new AssetBuilder()
      .addType(AssetEnum.MODULE)
      .addClassName(className)
      .addFilename(this.buildClassAssetFilename(moduleFilename))
      .addTemplate(this.buildClassAssetTemplate(className))
      .build();
  }

  private buildClassAssetFilename(moduleFilename: string): string {
    return path.join(
      process.cwd(),
      path.dirname(moduleFilename),
      'modules',
      this._assetName,
      new FileNameBuilder()
        .addAsset(AssetEnum.MODULE)
        .addName(this._assetName)
        .addExtension(this._extension)
        .addTest(false)
        .build()
    );
  }

  private buildClassAssetTemplate(className: string): Template {
    return new TemplateBuilder()
      .addFilename(path.resolve(
        __dirname,
        `../../../assets/${ this._extension }/module/module.${ this._extension }.template`)
      )
      .addReplacer({
        __CLASS_NAME__: className
      })
      .build();
  }

  private generate(assets): Promise<void> {
    return this._generator.generate(assets[0]);
  }
}
