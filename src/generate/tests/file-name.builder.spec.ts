import { expect } from 'chai';
import * as path from "path";

export class FileNameBuilder  {
  constructor() {}

  public buildFrom(type: string, name: string): string {
    return `${ this.extract(name) }.${ type }`;
  }

  private extract(name: string) {
    if (name.indexOf(path.sep)) {
      return name.split(path.sep).pop();
    } else {
      return name;
    }
  }
}

describe('FileNameBuilder', () => {
  let builder: FileNameBuilder;
  beforeEach(() => builder = new FileNameBuilder());

  describe('#buildFrom()', () => {
    it('should return the filename from asset type and simple name', () => {
      const type = 'type';
      const name = 'name';
      expect(builder.buildFrom(type, name)).to.be.equal('name.type');
    });
    it('should return the filename from asset type and path name', () => {
      const type = 'type';
      const name = 'path/to/name';
      expect(builder.buildFrom(type, name)).to.be.equal('name.type');
    });
  });
});
