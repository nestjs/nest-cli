import {Transform} from 'stream';

export class ReplaceTransform extends Transform {
  private chunks = [];
  private isBuffering: boolean = false;

  constructor(private origin: string, private destination: string) {
    super({ encoding: 'utf-8' });
  }

  _transform(chunk, encoding, done) {
    if (chunk.toString() === this.origin.charAt(0)) {
      this.isBuffering = !this.isBuffering;
    }
    if (this.isBuffering) {
      this.chunks.push(chunk);
    } else {
      this.push(chunk);
    }
    if (chunk.toString() === this.origin.charAt(this.origin.length - 1)) {
      this.isBuffering = !this.isBuffering;
      this.push(this.destination);
    }
    done();
  }
}
