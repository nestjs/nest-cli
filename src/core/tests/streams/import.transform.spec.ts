import {PassThrough, Readable, Transform, Writable} from 'stream';
import {ImportTransform} from '../../streams/import.transform';
import {expect} from 'chai';

describe('ImportTransform', () => {
  class BufferedReadable extends Readable {
    private isRead: boolean = false;
    constructor(private buffer: Buffer) {
      super();
    }
    _read() {
      if (!this.isRead) {
        this.push(this.buffer);
        this.isRead = !this.isRead;
      } else {
        this.push(null);
      }
    }
  }

  class BufferedWritable extends Writable {
    private buffer: string = '';
    constructor() {
      super();
    }

    _write(chunk, encoding, done) {
      this.buffer += chunk.toString();
      done();
    }

    public getBuffer() {
      return Buffer.from(this.buffer);
    }
  }

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
  beforeEach(() => transform = new ImportTransform(className, dirname));

  it('should add the imported asset', done => {
    const newContent: string =
      'import {Module} from \'@nestjs/common\';\n' +
      `import {${ className }} from ${ dirname };\n` +
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
