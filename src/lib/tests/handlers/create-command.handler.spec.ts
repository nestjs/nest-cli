import {CreateCommandHandler} from '../../handlers/create-command.handler';
import {CommandHandler} from '../../../common/interfaces/command.handler.interface';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {LoggerService} from '../../../core/loggers/logger.service';
import {GitRepository} from '../../../core/repositories/git.repository';

describe('CreateCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let handler: CommandHandler;
  beforeEach(() => {
    handler = new CreateCommandHandler();
  });

  let setLoggerStub: sinon.SinonStub;
  let cloneStub: sinon.SinonStub;
  beforeEach(() => {
    setLoggerStub = sandbox.stub(LoggerService, 'setLogger');
    cloneStub = sandbox.stub(GitRepository.prototype, 'clone').callsFake(() => Promise.resolve());
  });

  describe('#execute()', () => {
    it('should call LoggerService.setLogger() with the input logger', () => {
      return handler.execute({ name: 'application', destination: 'path/to/application' }, {}, console)
        .then(() => {
          expect(setLoggerStub.calledWith(console)).to.be.true;
        });
    });

    it('should clone the project repository to destination', () => {
      return handler.execute({ name: 'application', destination: 'path/to/application' }, {}, console)
        .then(() => {
          expect(cloneStub.calledOnce).to.be.true;
        });
    });
  });
});
