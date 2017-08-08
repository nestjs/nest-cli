import {Processor} from '../../../common/asset/interfaces/processor.interface';
import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';
import {ModuleUpdater} from '../../../common/asset/interfaces/module.updater.interface';
import {Generator} from '../../../common/asset/interfaces/generator.interface';
import {ModuleFinderImpl} from '../module-finders/module.finder';
import {AssetGenerator} from '../generators/asset.generator';
import {ModuleUpdaterImpl} from '../module-updaters/module.updater';
import {Asset} from '../../../common/asset/interfaces/asset.interface';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {AssetBuilder} from '../builders/asset.builder';
import * as path from 'path';
import {TemplateBuilder} from '../builders/template.builder';
import {CommandOptions} from '../../../common/program/interfaces/command.options.interface';
import {CommandArguments} from '../../../common/program/interfaces/command.aguments.interface';

export class GatewayProcessor implements Processor {
  private _finder: ModuleFinder;
  private _generator: Generator;
  private _updater: ModuleUpdater;

  constructor(
    private _assetName: string,
    private _moduleName: string,
    private _extension: string
  ) {
    this._finder = new ModuleFinderImpl();
    this._generator = new AssetGenerator();
    this._updater = new ModuleUpdaterImpl();
  }

  public processV2(args: CommandArguments, options: CommandOptions): Promise<void> {
    throw new Error("Method not implemented.");
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
    return assets
  }

  private buildClassName() {
    return new ClassNameBuilder()
      .addName(this._assetName)
      .addAsset(AssetEnum.GATEWAY)
      .build();
  }

  private buildFilename() {
    return new FileNameBuilder()
      .addAsset(AssetEnum.GATEWAY)
      .addName(this._assetName)
      .addExtension(this._extension)
      .addTest(false)
      .build();
  }

  private buildClassAsset(className: string, filename: string, moduleFilename: string): Asset {
    return new AssetBuilder()
      .addType(AssetEnum.GATEWAY)
      .addClassName(className)
      .addFilename(this.buildClassAssetFilename(filename, moduleFilename))
      .addTemplate(this.buildClassAssetTemplate(filename, className))
      .build();
  }

  private buildClassAssetFilename(filename: string, moduleName: string) {
    return path.join(
      process.cwd(),
      path.dirname(moduleName),
      'gateways',
      filename.replace(`.gateway.${ this._extension}`, ''),
      filename
    );
  }

  private buildClassAssetTemplate(filename: string, className: string) {
    return new TemplateBuilder()
      .addFilename(path.resolve(__dirname, `../../../assets/${ this._extension }/gateway/gateway.${ this._extension }.template`))
      .addReplacer({
        __CLASS_NAME__: className,
        __DIR_NAME__: `'./gateways/${ filename.replace(`.gateway.${ this._extension}`, '')}/${ filename.replace(`.${ this._extension }`, '') }'`
      })
      .build();
  }

  private generate(assets: Asset[]): Promise<void> {
    return this._generator.generate(assets[0]);
  }

  private updateModule(moduleFilename: string, assets: Asset[]): Promise<void> {
    return this._updater.update(path.join(process.cwd(), moduleFilename), assets[0]);
  }

}
