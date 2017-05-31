import {Transform} from 'stream';

export class ReplaceTransform extends Transform {
  constructor(private origin: string, private destination: string) {
    super({ encoding: 'utf-8' });
  }

  _transform(chunk, encoding, done) {
    this.push(chunk.toString().split(this.origin).join(this.destination));
    done();
  }
}
