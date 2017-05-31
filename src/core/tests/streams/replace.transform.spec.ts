import {Readable, Transform, Writable} from 'stream';
import {ReplaceTransform} from '../../streams/replace.transform';
import {expect} from 'chai';

describe('ReplaceTransform', () => {
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

  it('should replace data in the stream', done => {
    const reader: Readable = new BufferedReadable(Buffer.from('class [NAME]'));
    const transformer: Transform = new ReplaceTransform('[NAME]', 'value');
    const writer: Writable = new BufferedWritable();

    reader.on('end', () => {
      expect((writer as BufferedWritable).getBuffer().toString()).to.be.equal('class value');
      done();
    });
    reader
      .pipe(transformer)
      .pipe(writer);
  });
});
