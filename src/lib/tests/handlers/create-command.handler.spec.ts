import {CreateCommandHandler} from '../../handlers/create-command.handler';
import {CommandHandler} from '../../../common/interfaces/command.handler.interface';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {LoggerService} from '../../../core/loggers/logger.service';

describe('CreateCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let handler: CommandHandler;
  beforeEach(() => {
    handler = new CreateCommandHandler();
  });

  let setLoggerStub: sinon.SinonStub;
  beforeEach(() => {
    setLoggerStub = sandbox.stub(LoggerService, 'setLogger');
  });

  describe('#execute()', () => {
    it('should call LoggerService.setLogger() with the input logger', done => {
      handler.execute({asset: 'module', name: 'name'}, {}, console)
        .then(() => {
          expect(setLoggerStub.calledWith(console)).to.be.true;
          done();
        })
        .catch(done);
    });
  });
});
