import {Generator} from '../../common/interfaces/generator.interface';
import {Readable, Writable} from 'stream';
import * as fs from 'fs';
import * as path from 'path';

export class ComponentGenerator implements Generator {
  private templatePath: string = '../../assets/ts/component/component.ts.template';
  private testTemplatePath: string = '../../assets/ts/component/component.spec.ts.template';
  private filename: string = '[name].service.ts';
  private testFilename: string = '[name].service.spec.ts';

  public generate(name: string): Promise<void> {
    this.generateAsset(name);
    this.generateTestAsset(name);
    return Promise.resolve();
  }

  private generateAsset(name: string): void {
    const reader: Readable = fs.createReadStream(path.resolve(__dirname, this.templatePath));
    const writer: Writable = fs.createWriteStream(path.resolve(process.cwd(), name, this.filename));
    reader.pipe(writer);
  }

  private generateTestAsset(name: string): void {
    const reader: Readable = fs.createReadStream(path.resolve(__dirname, this.testTemplatePath));
    const writer: Writable = fs.createWriteStream(path.resolve(process.cwd(), name, this.testFilename));
    reader.pipe(writer);
  }
}
