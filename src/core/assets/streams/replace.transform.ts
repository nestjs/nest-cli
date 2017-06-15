import {Transform} from 'stream';
import {Replacer} from '../../../common/asset/interfaces/replacer.interface';

export class ReplaceTransform extends Transform {
  constructor(private replacer: Replacer) {
    super({ encoding: 'utf-8' });
  }

  _transform(chunk, encoding, done) {
    let output: string = chunk.toString();
    const keys: string[] = Object.keys(this.replacer);
    keys.forEach(key => {
      output = output.split(key).join(this.replacer[key]);
    });
    this.push(output);
    done();
  }
}
