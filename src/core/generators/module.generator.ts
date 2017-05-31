import {Generator} from '../../common/interfaces/generator.interface';
import * as path from 'path';
import * as fs from 'fs';
import {Readable, Writable} from 'stream';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {AssetEnum} from '../../common/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {ReplaceTransform} from '../streams/replace.transform';

export class ModuleGenerator implements Generator {
  private templatePath: string = path.resolve(__dirname, '../../assets/ts/module/module.ts.template');

  public generate(name: string): Promise<void> {
    const asset = {
      path: name,
      className: new ClassNameBuilder().addName(name).addAsset(AssetEnum.MODULE).build(),
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.MODULE).addExtension('ts').build()
    };
    this.copy(asset);
    return Promise.resolve();
  }

  private copy(asset: any, isTest: boolean = false) {
    const reader: Readable = fs.createReadStream(this.templatePath);
    const writer: Writable = fs.createWriteStream(path.resolve(process.cwd(), asset.path, asset.filename));
    reader.pipe(new ReplaceTransform('[NAME]', asset.className)).pipe(writer);
  }
}
