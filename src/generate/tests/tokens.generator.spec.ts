import { expect } from 'chai';
import { TokenName, TokensGenerator } from '../tokens.generator';

describe('TokensGenerator', () => {
  let generator: TokensGenerator;
  beforeEach(() => generator = new TokensGenerator());
  describe('#generateFrom()', () => {
    it('should generate tokens regarding type and name', () => {
      const type = 'type';
      const name = 'name';
      expect(generator.generateFrom(type, name)).to.be.deep.equal([
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
