import { expect } from 'chai';
import { FileNameBuilder } from '../file-name.builder';

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
