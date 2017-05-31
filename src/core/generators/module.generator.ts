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
    const { className, filename } = this.buildAsset(name);
    this.copyAsset(className, name, filename);
    return Promise.resolve();
  }

  private buildAsset(name: string): any {
    return {
      className: new ClassNameBuilder().addName(name).addAsset(AssetEnum.MODULE).build(),
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.MODULE).addExtension('ts').build()
    }
  }

  private copyAsset(className: string, name: string, filename: string) {
    const reader: Readable = fs.createReadStream(this.templatePath);
    const writer: Writable = fs.createWriteStream(path.resolve(process.cwd(), name, filename));
    reader.pipe(new ReplaceTransform('[NAME]', className)).pipe(writer);
  }
}
