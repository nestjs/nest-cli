import { expect } from 'chai';
import { TokensGenerator } from '../tokens.generator';
import { TokenName } from '../token';
import { Asset } from '../asset';
import * as path from "path";

describe('TokensGenerator', () => {
  let generator: TokensGenerator;
  beforeEach(() => generator = new TokensGenerator());
  describe('#generate()', () => {
    it('should generate replace tokens', () => {
      const asset: Asset = {
        type: 'type',
        name: 'name',
        template: {
          name: 'type.ts.template',
          content: 'content'
        },
        className: 'NameType',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.type.ts'
      };
      expect(generator.generate(asset)).to.be.deep.equal([
        {
          name: TokenName.CLASS_NAME,
          value: 'NameType'
        },
        {
          name: TokenName.SPEC_IMPORT,
          value: './name.type'
        }
      ]);
    });
  });
});
