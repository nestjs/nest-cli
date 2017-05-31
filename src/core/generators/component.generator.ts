import {Generator} from '../../common/interfaces/generator.interface';
import {Readable, Writable} from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import {ReplaceTransform} from '../streams/replace.transform';
import {AssetEnum} from '../../common/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {LoggerService} from '../loggers/logger.service';
import {Logger} from '../../common/interfaces/logger.interface';
import {ColorService} from '../loggers/color.service';
import {Asset} from '../../common/interfaces/asset.interface';
import {ComponentAsset, TestComponentAsset} from '../assets/component.asset.interface';

export class ComponentGenerator implements Generator {
  private templatePath: string = '../../assets/ts/component/component.ts.template';
  private testTemplatePath: string = '../../assets/ts/component/component.spec.ts.template';
  private logger: Logger = LoggerService.getLogger();

  public generate(name: string): Promise<void> {
    this.generateAsset(name);
    this.generateTestAsset(name);
    return Promise.resolve();
  }

  private generateAsset(name: string): void {
    const asset: ComponentAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).build(),
      }
    };
    this.copy(asset);
  }

  private generateTestAsset(name: string): void {
    const asset: TestComponentAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).addTest(true).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).build(),
        __IMPORT__: new FileNameBuilder().addName(name).addAsset(AssetEnum.COMPONENT).addExtension('ts').build()
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
