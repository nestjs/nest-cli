import {Transform} from 'stream';

export class ImportTransform extends Transform {
  private template: string = 'import {__CLASS_NAME__} from __DIR_NAME__;\n';

  constructor(private className: string, private dirname: string) {
    super({ encoding: 'utf-8' });
  }

  _transform(chunk, encoding, done) {
    const lines: string[] = chunk.toString().split('\n');
    const emptyIndex = lines.findIndex(line => line === '');
    lines[emptyIndex] = this.template.replace('__CLASS_NAME__', this.className).replace('__DIR_NAME__', this.dirname);
    this.push(lines.join('\n'));
    done();
  }
}
