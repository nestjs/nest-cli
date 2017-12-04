import { expect } from 'chai';
import { ClassNameGenerator } from '../class-name.generator';

describe('ClassNameBuilder', () => {
  let builder: ClassNameGenerator;
  beforeEach(() => builder = new ClassNameGenerator());

  describe('#generate()', () => {
    const type = 'type';
    it('should build the class name from asset type and simple name', () => {
      const name = 'name';
      expect(builder.generate(type, name)).to.be.equal('NameType');
    });
    it('should build the class name from asset type and path name', () => {
      const name = 'pat/to/name';
      expect(builder.generate(type, name)).to.be.equal('NameType');
    });
  });
});
