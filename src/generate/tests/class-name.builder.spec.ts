import { expect } from 'chai';
import { ClassNameBuilder } from '../class-name.builder';

describe('ClassNameBuilder', () => {
  let builder: ClassNameBuilder;
  beforeEach(() => builder = new ClassNameBuilder());

  describe('#buildFrom()', () => {
    const type = 'type';
    it('should build the class name from asset type and simple name', () => {
      const name = 'name';
      expect(builder.buildFrom(type, name)).to.be.equal('NameType');
    });
    it('should build the class name from asset type and path name', () => {
      const name = 'pat/to/name';
      expect(builder.buildFrom(type, name)).to.be.equal('NameType');
    });
  });
});
