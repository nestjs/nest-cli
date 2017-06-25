import {Readable, Transform, Writable} from 'stream';
import {AssetEnum} from '../../../../common/asset/enums/asset.enum';
import {BufferedReadable, BufferedWritable} from './test.utils';
import {expect} from 'chai';
import {MetadataTransform} from '../metadata.transform';

describe('MetadataTransformV2', () => {
  let reader: Readable;
  let writer: Writable;

  let transform: Transform;

  context('no module metadata for asset type', () => {
    beforeEach(() => transform = new MetadataTransform(AssetEnum.COMPONENT));

    const content: string =
      'import {Module} from \'@nestjs/common\';\n' +
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
        '\n' +
        '@Module({\n' +
        '  components: [\n' +
        '    __CLASS_NAME__\n' +
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
    beforeEach(() => transform = new MetadataTransform(AssetEnum.COMPONENT));

    const content: string =
      'import {Module} from \'@nestjs/common\';\n' +
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
        '\n' +
        '@Module({\n' +
        '  components: [\n' +
        '    OtherAssetService,\n' +
        '    __CLASS_NAME__\n' +
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

  context('asset metadata transform', () => {
    const content: string =
      'import {Module} from \'@nestjs/common\';\n' +
      '\n' +
      '@Module({})\n' +
      'export class AssetModule {}\n';

    beforeEach(() => {
      reader = new BufferedReadable(Buffer.from(content));
      writer = new BufferedWritable();
    });

    it('should add a controller entry in controllers metadata', done => {
      transform = new MetadataTransform(AssetEnum.CONTROLLER);
      const newContent: string =
        'import {Module} from \'@nestjs/common\';\n' +
        '\n' +
        '@Module({\n' +
        '  controllers: [\n' +
        '    __CLASS_NAME__\n' +
        '  ]\n' +
        '})\n' +
        'export class AssetModule {}\n';
      reader.on('end', () => {
        expect((writer as BufferedWritable).getBuffer().toString()).to.be.equal(newContent);
        done();
      });
      reader.pipe(transform).pipe(writer);
    });

    it('should add a component entry in components metadata', done => {
      transform = new MetadataTransform(AssetEnum.COMPONENT);
      const newContent: string =
        'import {Module} from \'@nestjs/common\';\n' +
        '\n' +
        '@Module({\n' +
        '  components: [\n' +
        '    __CLASS_NAME__\n' +
        '  ]\n' +
        '})\n' +
        'export class AssetModule {}\n';
      reader.on('end', () => {
        expect((writer as BufferedWritable).getBuffer().toString()).to.be.equal(newContent);
        done();
      });
      reader.pipe(transform).pipe(writer);
    });

    it('should add a gateway entry in components metadate', done => {
      transform = new MetadataTransform(AssetEnum.GATEWAY);
      const newContent: string =
        'import {Module} from \'@nestjs/common\';\n' +
        '\n' +
        '@Module({\n' +
        '  components: [\n' +
        '    __CLASS_NAME__\n' +
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

