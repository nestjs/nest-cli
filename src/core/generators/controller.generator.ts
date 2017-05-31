import {Generator} from '../../common/interfaces/generator.interface';
import {Readable, Writable} from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import {ReplaceTransform} from '../streams/replace.transform';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {AssetEnum} from '../../common/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {LoggerService} from '../loggers/logger.service';
import {Logger} from '../../common/interfaces/logger.interface';
import {ColorService} from '../loggers/color.service';
import {ControllerAsset, TestControllerAsset} from '../assets/controller.asset.interface';

export class ControllerGenerator implements Generator {
  private templatePath: string = '../../assets/ts/controller/controller.ts.template';
  private testTemplatePath: string = '../../assets/ts/controller/controller.spec.ts.template';
  private logger: Logger = LoggerService.getLogger();

  public generate(name: string): Promise<void> {
    this.generateAsset(name);
    this.generateTestAsset(name);
    return Promise.resolve();
  }

  private generateAsset(name: string): void {
    const asset: ControllerAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).build(),
        __URI_PATH__: ''
      }
    };
    this.copy(asset);
  }

  private generateTestAsset(name: string): void {
    const asset: TestControllerAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).addTest(true).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).build(),
        __IMPORT__: new FileNameBuilder().addName(name).addAsset(AssetEnum.CONTROLLER).addExtension('ts').build(),
      }
    };
    this.copy(asset, true);
  }

  private copy(asset: any, isTest: boolean = false) {
    const template: string = path.resolve(__dirname, isTest ? this.testTemplatePath : this.templatePath);
    const reader: Readable = fs.createReadStream(template);
    const writer: Writable = fs.createWriteStream(path.resolve(process.cwd(), asset.path, asset.filename));
    reader
      .pipe(new ReplaceTransform(asset.replacer))
      .pipe(writer);
    this.logger.info(ColorService.green('create'), `${ asset.path }/${ asset.filename }`);
  }
}
