import {Generator} from '../../common/interfaces/generator.interface';
import * as path from 'path';
import * as fs from 'fs';
import {Readable, Writable} from 'stream';
import {ClassNameBuilder} from '../builders/class-name.builder';
import {AssetEnum} from '../../common/enums/asset.enum';
import {FileNameBuilder} from '../builders/file-name.builder';
import {ReplaceTransform} from '../streams/replace.transform';
import {Logger} from '../../common/interfaces/logger.interface';
import {LoggerService} from '../loggers/logger.service';
import {ColorService} from '../loggers/color.service';
import {Asset} from '../../common/interfaces/asset.interface';
import {ModuleAsset} from '../assets/module.asset.interface';

export class ModuleGenerator implements Generator {
  private templatePath: string = path.resolve(__dirname, '../../assets/ts/module/module.ts.template');
  private logger: Logger = LoggerService.getLogger();

  public generate(name: string): Promise<void> {
    const asset: ModuleAsset = {
      path: name,
      filename: new FileNameBuilder().addName(name).addAsset(AssetEnum.MODULE).addExtension('ts').build(),
      replacer: {
        __CLASS_NAME__: new ClassNameBuilder().addName(name).addAsset(AssetEnum.MODULE).build()
      }
    };
    this.copy(asset);
    return Promise.resolve();
  }

  private copy(asset: any, isTest: boolean = false) {
    const reader: Readable = fs.createReadStream(this.templatePath);
    const writer: Writable = fs.createWriteStream(path.resolve(process.cwd(), asset.path, asset.filename));
    reader
      .pipe(new ReplaceTransform(asset.replacer))
      .pipe(writer);
    this.logger.info(ColorService.green('create'), `${ asset.path }/${ asset.filename }`);
  }
}
