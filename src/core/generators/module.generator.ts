import {Generator} from '../../common/interfaces/generator.interface';
import * as path from 'path';
import * as fs from 'fs';
import {Readable, Writable} from 'stream';

export class ModuleGenerator implements Generator {
  private templatePath: string = path.resolve(__dirname, '../../assets/ts/module/module.ts.template');
  private filename: string = '[name].module.ts';

  public generate(name: string): Promise<void> {
    const reader: Readable = fs.createReadStream(this.templatePath);
    const writer: Writable = fs.createWriteStream(path.resolve(process.cwd(), name, this.filename));
    reader.pipe(writer);
    return Promise.resolve();
  }
}
