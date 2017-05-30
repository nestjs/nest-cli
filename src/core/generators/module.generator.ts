import {Generator} from '../../common/interfaces/generator.interface';
import * as path from 'path';
import * as fs from 'fs';

export class ModuleGenerator implements Generator {
  private templatePath: string = path.resolve(__dirname, '../../assets/ts/module/module.ts.template');
  private filename: string = '[name].module.ts';

  public generate(name: string): Promise<void> {
    const readStream = fs.createReadStream(this.templatePath);
    const writeStream = fs.createWriteStream(path.resolve(name, this.filename));
    return Promise.resolve();
  }
}
