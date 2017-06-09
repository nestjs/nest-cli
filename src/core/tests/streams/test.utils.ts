import {Readable, Writable} from 'stream';

export class BufferedReadable extends Readable {
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

export class BufferedWritable extends Writable {
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
