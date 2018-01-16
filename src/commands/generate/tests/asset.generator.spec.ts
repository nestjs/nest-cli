import { expect } from 'chai';
import * as sinon from 'sinon';
import { AssetGenerator } from '../asset.generator';
import { LoggerService } from '../../../logger/logger.service';
import { Asset } from '../asset';
import * as path from 'path';

describe('AssetGenerator', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  beforeEach(() => {
    LoggerService.setLogger({
      debug: () => {},
      error: () => {},
      info: () => {},
      log: () => {},
      warn: () => {}
    });
  });

  let generator: AssetGenerator;
  beforeEach(() => generator = new AssetGenerator());

  describe('#generate()', () => {
    const asset: Asset = {
      type: 'type',
      name: 'name',
      template: {
        name: 'type.ts.template',
        content: 'content'
      }
    };
    it('should return an asset', () => {
      expect(generator.generate(asset)).to.be.deep.equal(
        Object.assign({
          className: 'NameType',
          directory: path.join(process.cwd(), 'src/modules', 'name'),
          filename: 'name.type.ts'
        }, asset)
      );
    });
  });
});
