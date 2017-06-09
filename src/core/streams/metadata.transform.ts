import {Transform} from 'stream';
import {AssetEnum} from '../../common/enums/asset.enum';

export class MetadataTransform extends Transform {
  private MODULE_METADATA_REGEX = /@Module\(([\s\S]*?)\)/;

  constructor(private className: string, private asset: AssetEnum) {
    super({ encoding: 'utf-8' });
  }

  _transform(chunk, encoding, done) {
    const metadata: any = this.update(JSON.parse(this.MODULE_METADATA_REGEX.exec(chunk)[1].replace(/([a-zA-Z]+)/g, '"$1"')));
    const output: string = chunk.toString().replace(this.MODULE_METADATA_REGEX, `@Module(${ JSON.stringify(metadata, null, 2).replace(/"/g, '') })`);
    this.push(output);
    done();
  }

  private update(metadata: any) {
    switch (this.asset) {
      case AssetEnum.COMPONENT:
        metadata = this.updateComponents(metadata);
        break;
      case AssetEnum.CONTROLLER:
        metadata = this.updateControllers(metadata);
        break;
    }
    return metadata;
  }

  private updateComponents(metadata: any) {
    if (metadata.hasOwnProperty('components')) {
      (metadata['components'] as Array<string>).push(this.className);
    } else {
      metadata.components = [ this.className ];
    }
    return metadata;
  }

  private updateControllers(metadata: any) {
    if (metadata.hasOwnProperty('controllers')) {
      (metadata['controllers'] as Array<string>).push(this.className);
    } else {
      metadata.controllers = [ this.className ];
    }
    return metadata;
  }
}
