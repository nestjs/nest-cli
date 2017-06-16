import {GenerateCommandHandler} from '../generate-command.handler';
import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import {AssetGenerator} from '../../../core/assets/generators/asset.generator';
import * as sinon from 'sinon';
import {expect} from 'chai';

describe('GenerateCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let handler: CommandHandler;
  beforeEach(() => {
    handler = new GenerateCommandHandler();
  });

  let generateStub: sinon.SinonStub;
  beforeEach(() => {
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generateFrom').callsFake(() => Promise.resolve());
  });

  describe('#execute()', () => {
    it('should use the AssetGenerator.generate()', () => {
      handler.execute({ asset: 'module', name: 'name' }, {}, console)
        .then(() => {
          expect(generateStub.calledOnce).to.be.true;
        });
    });
  });
});
