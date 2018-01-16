import { expect } from 'chai';
import { AssetClassNameGenerator } from '../asset-class-name.generator';
import { Asset } from '../asset';

describe('AssetClassNameBuilder', () => {
  let builder: AssetClassNameGenerator;
  beforeEach(() => builder = new AssetClassNameGenerator());

  describe('#generate()', () => {
    it('should generate the class name from asset type with simple name', () => {
      const asset: Asset = {
        name: 'name',
        type: 'type'
      };
      expect(builder.generate(asset)).to.be.deep.equal('NameType');
    });
    it('should generate the class name from asset type with path name', () => {
      const asset: Asset = {
        name: 'path/to/name',
        type: 'type'
      };
      expect(builder.generate(asset)).to.be.deep.equal('NameType');
    });
  });
});
