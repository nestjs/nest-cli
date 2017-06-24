import {Readable, Transform, Writable} from 'stream';
import {MetadataTransform} from '../metadata.transform';
import {AssetEnum} from '../../../../common/asset/enums/asset.enum';
import {BufferedReadable, BufferedWritable} from './test.utils';
import {expect} from 'chai';

describe('MetadataTransform', () => {
  const className: string = 'AssetService';
  const dirName: string = './path/to/asset/asset.service';

  let reader: Readable;
  let writer: Writable;

  let transform: Transform;
  beforeEach(() => transform = new MetadataTransform(className, AssetEnum.COMPONENT));

  context('no module metadata for asset type', () => {
    const content: string =
      'import {Module} from \'@nestjs/common\';\n' +
      `import {${ className }} from ${ dirName };\n` +
      '\n' +
      '@Module({})\n' +
      'export class AssetModule {}\n';

    beforeEach(() => {
      reader = new BufferedReadable(Buffer.from(content));
      writer = new BufferedWritable();
    });
    it('should update the module metadata', done => {
      const newContent: string =
        'import {Module} from \'@nestjs/common\';\n' +
        `import {${ className }} from ${ dirName };\n` +
        '\n' +
        '@Module({\n' +
        '  components: [\n' +
        '    AssetService\n' +
        '  ]\n' +
        '})\n' +
        'export class AssetModule {}\n';
      reader.on('end', () => {
        expect((writer as BufferedWritable).getBuffer().toString()).to.be.equal(newContent);
        done();
      });
      reader.pipe(transform).pipe(writer);
    });
  });

  context('existing metadata for asset type', () => {
    const content: string =
      'import {Module} from \'@nestjs/common\';\n' +
      `import {${ className }} from ${ dirName };\n` +
      '\n' +
      '@Module({\n' +
      '  components: [\n' +
      '    OtherAssetService\n' +
      '  ]\n' +
      '})\n' +
      'export class AssetModule {}\n';

    beforeEach(() => {
      reader = new BufferedReadable(Buffer.from(content));
      writer = new BufferedWritable();
    });
    it('should update the module metadata', done => {
      const newContent: string =
        'import {Module} from \'@nestjs/common\';\n' +
        `import {${ className }} from ${ dirName };\n` +
        '\n' +
        '@Module({\n' +
        '  components: [\n' +
        '    OtherAssetService,\n' +
        '    AssetService\n' +
        '  ]\n' +
        '})\n' +
        'export class AssetModule {}\n';
      reader.on('end', () => {
        expect((writer as BufferedWritable).getBuffer().toString()).to.be.equal(newContent);
        done();
      });
      reader.pipe(transform).pipe(writer);
    });
  });
});
