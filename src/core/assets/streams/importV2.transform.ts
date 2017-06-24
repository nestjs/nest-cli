import {Transform} from 'stream';

export class ImportTransformV2 extends Transform {
  private template: string = 'import {__CLASS_NAME__} from __DIR_NAME__;\n';

  constructor() {
    super({ encoding: 'utf-8' });
  }

  _transform(chunk, encoding, done) {
    const lines: string[] = chunk.toString().split('\n');
    const emptyIndex = lines.findIndex(line => line === '');
    lines[emptyIndex] = this.template;
    this.push(lines.join('\n'));
    done();
  }
}

