import {ColorService} from '../loggers/color.service';
import {ReplaceTransform} from '../streams/replace.transform';
import * as path from 'path';
import * as fs from 'fs';
import {Readable, Writable} from 'stream';
import {Logger} from '../../common/interfaces/logger.interface';
import {LoggerService} from '../loggers/logger.service';
import {Generator} from '../../common/interfaces/generator.interface';

export abstract class AbstractAssetGenerator implements Generator {
  protected logger: Logger = LoggerService.getLogger();

  protected copy(asset: any, template: string) {
    const target: string = path.resolve(__dirname, template);
    const reader: Readable = fs.createReadStream(target);
    const writer: Writable = fs.createWriteStream(path.resolve(process.cwd(), asset.path, asset.filename));
    reader
      .pipe(new ReplaceTransform(asset.replacer))
      .pipe(writer);
    this.logger.info(ColorService.green('create'), `${ asset.path }/${ asset.filename }`);
  }

  public abstract generate(name: string): Promise<void>;
}
