import { expect } from 'chai';
import { AssetFileNameGenerator } from '../asset-file-name.generator';
import { Asset } from '../asset';

describe('AssetFileNameBuilder', () => {
  let generator: AssetFileNameGenerator;
  beforeEach(() => generator = new AssetFileNameGenerator());

  describe('#generate()', () => {
    it('should return the filename from asset type and simple name', () => {
      const asset: Asset = {
        type: 'type',
        name: 'name',
        template: {
          name: 'type.ts.template',
          content: 'content'
        }
      };
      expect(generator.generate(asset)).to.be.equal('name.type.ts');
    });
    it('should return the spec filename from asset type and simple name', () => {
      const asset: Asset = {
        type: 'type',
        name: 'name',
        template: {
          name: 'type.spec.ts.template',
          content: 'content'
        }
      };
      expect(generator.generate(asset)).to.be.equal('name.type.spec.ts');
    });
    it('should return the filename from asset type and path name', () => {
      const asset: Asset = {
        type: 'type',
        name: 'path/to/name',
        template: {
          name: 'type.ts.template',
          content: 'content'
        }
      };
      expect(generator.generate(asset)).to.be.equal('name.type.ts');
    });
  });
});
