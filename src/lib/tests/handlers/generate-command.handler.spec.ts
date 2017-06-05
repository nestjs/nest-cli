import {GenerateCommandHandler} from '../../handlers/generate-command.handler';
import {CommandHandler} from '../../../common/interfaces/command.handler.interface';
import {AssetGenerator} from '../../../core/generators/asset.generator';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {LoggerService} from '../../../core/loggers/logger.service';

describe('GenerateCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let handler: CommandHandler;
  beforeEach(() => {
    handler = new GenerateCommandHandler();
  });

  let setLoggerStub: sinon.SinonStub;
  let generateStub: sinon.SinonStub;
  beforeEach(() => {
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
    setLoggerStub = sandbox.stub(LoggerService, 'setLogger');
  });

  describe('#execute()', () => {
    it('should call LoggerService.setLogger() with the input logger', () => {
      return handler.execute({ asset: 'module', name: 'name' }, {}, console)
        .then(() => {
          expect(setLoggerStub.calledWith(console)).to.be.true;
        });
    });

    it('should use the AssetGenerator.generate()', () => {
      handler.execute({ asset: 'module', name: 'name' }, {}, console)
        .then(() => {
          expect(generateStub.calledOnce).to.be.true;
        });
    });
  });
});
