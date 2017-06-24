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

export class ModuleProcessor implements Processor {
  private _generator: Generator;
  private _assets: Asset[];

  constructor(private _name: string, private _extension: string) {
    this._generator = new AssetGenerator();
    this._assets = [];
  }

  public process(): Promise<void> {
    this.buildAssets();
    return this.generate();
  }

  private buildAssets() {
    const className: string = new ClassNameBuilder()
      .addName(this._name)
      .addAsset(AssetEnum.MODULE)
      .build();
    const asset: Asset = new AssetBuilder()
      .addClassName(className)
      .addFilename(
        path.join(
          process.cwd(),
          'src/app/modules',
          this._name,
          new FileNameBuilder()
            .addAsset(AssetEnum.MODULE)
            .addName(this._name)
            .addExtension(this._extension)
            .addTest(false)
            .build()
        )
      )
      .addTemplate(
        new TemplateBuilder()
          .addFilename(path.resolve(__dirname, `../../../assets/${ this._extension }/module/module.${ this._extension }.template`))
          .addReplacer({
            __CLASS_NAME__: className
          })
          .build()
      )
      .build();
    this._assets.push(asset);
  }

  private generate(): Promise<void> {
    return this._generator.generate(this._assets[0]);
  }
}
