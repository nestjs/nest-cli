import {Readable, Transform, Writable} from 'stream';
import {BufferedReadable, BufferedWritable} from './test.utils';
import {expect} from 'chai';
import {ImportTransform} from '../import.transform';

describe('ImportTransformV2', () => {
  const content: string = '' +
    'import {Module} from \'@nestjs/common\';\n' +
    '\n' +
    '@Module({})\n' +
    'export class AssetModule {}\n';
  const className: string = 'AssetService';
  const dirname: string = './path/to/asset/asset.service';

  let reader: Readable;
  let writer: Writable;
  beforeEach(() => {
    reader = new BufferedReadable(Buffer.from(content));
    writer = new BufferedWritable();
  });

  let transform: Transform;
  beforeEach(() => transform = new ImportTransform());

  it('should add the imported asset', done => {
    const newContent: string =
      'import {Module} from \'@nestjs/common\';\n' +
      `import {__CLASS_NAME__} from __DIR_NAME__;\n` +
      '\n' +
      '@Module({})\n' +
      'export class AssetModule {}\n';
    reader.on('end', () => {
      expect((writer as BufferedWritable).getBuffer().toString()).to.be.equal(newContent);
      done();
    });
    reader.pipe(transform).pipe(writer);
  });
});
