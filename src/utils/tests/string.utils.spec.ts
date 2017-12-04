import {StringUtils} from '../string.utils';
import {expect} from 'chai';
import * as sinon from 'sinon';
import * as os from 'os';

describe('StringUtils', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  describe('#capitalize()', () => {
    const capitalizeResult: string = 'PathToName';

    it('should capitalize a word expression', () => {
      const expression: string = 'pathToName';
      expect(StringUtils.capitalize(expression)).to.be.equal(capitalizeResult);
    });

    it('should capitalize a Unix style path expression', () => {
      const expression: string = 'path/to/name';
      sandbox.stub(os, 'platform').callsFake(() => 'notWin32');
      expect(StringUtils.capitalize(expression)).to.be.equal(capitalizeResult);
    });

    it('should capitalize a Windows style path expression', () => {
      sandbox.stub(os, 'platform').callsFake(() => 'win32');
      const expression: string = 'path\\\\to\\\\name';
      expect(StringUtils.capitalize(expression)).to.be.equal(capitalizeResult);
    });

    it('should capitalize the bridge case expression', () => {
      const expression: string = 'path-to-name';
      expect(StringUtils.capitalize(expression)).to.be.equal(capitalizeResult);
    });
  });
});
