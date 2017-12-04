import { expect } from 'chai';
import { FileNameGenerator } from '../file-name.generator';

describe('FileNameBuilder', () => {
  let builder: FileNameGenerator;
  beforeEach(() => builder = new FileNameGenerator());

  describe('#generate()', () => {
    it('should return the filename from asset type and simple name', () => {
      const type = 'type';
      const name = 'name';
      expect(builder.generate(type, name)).to.be.equal('name.type');
    });
    it('should return the filename from asset type and path name', () => {
      const type = 'type';
      const name = 'path/to/name';
      expect(builder.generate(type, name)).to.be.equal('name.type');
    });
  });
});
