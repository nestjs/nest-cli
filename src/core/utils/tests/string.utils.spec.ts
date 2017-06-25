import {expect} from 'chai';
import {StringUtils} from '../string.utils';

describe('StringUtils', () => {
  describe('#capitalize()', () => {
    const capitalizeResult: string = 'PathToName';

    it('should capitalize a word expression', () => {
      const expression: string = 'pathToName';
      expect(StringUtils.capitalize(expression)).to.be.equal(capitalizeResult);
    });

    it('should capitalize a path expression', () => {
      const expression: string = 'path/to/name';
      expect(StringUtils.capitalize(expression)).to.be.equal(capitalizeResult);
    });

    it('should capitalize the bridge case expression', () => {
      const expression: string = 'path-to-name';
      expect(StringUtils.capitalize(expression)).to.be.equal(capitalizeResult);
    });
  });
});
