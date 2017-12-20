import { expect } from 'chai';
import { Asset } from '../asset';
import * as path from 'path';
import { AssetDirectoryNameGenerator } from '../asset-directory-name.generator';

describe('AssetDirectoryNameGenerator', () => {
  let generator: AssetDirectoryNameGenerator;
  beforeEach(() => generator = new AssetDirectoryNameGenerator());
  describe('#generate()', () => {
    const asset: Asset = {
      type: 'type',
      name: 'name'
    };
    it('should return the generated asset directory name', () => {
      expect(generator.generate(asset)).to.be.equal(
        path.join(process.cwd(), 'src/modules', 'name')
      );
    });
  });
});
