import {Generator} from '../../common/interfaces/generator.interface';
import {Readable, Writable} from 'stream';
import * as fs from 'fs';
import * as path from 'path';

export class ControllerGenerator implements Generator {
  private templatePath: string = '../../assets/ts/controller/controller.ts.template';
  private testTemplatePath: string = '../../assets/ts/controller/controller.spec.ts.template';
  private filename: string = '[name].controller.ts';
  private testFilename: string = '[name].controller.spec.ts';

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
