import {CreateCommandHandler} from '../../handlers/create-command.handler';
import {CommandHandler} from '../../../common/interfaces/command.handler.interface';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {GitRepository} from '../../../core/repositories/git.repository';

describe('CreateCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let handler: CommandHandler;
  beforeEach(() => {
    handler = new CreateCommandHandler();
  });

  let cloneStub: sinon.SinonStub;
  beforeEach(() => {
    cloneStub = sandbox.stub(GitRepository.prototype, 'clone').callsFake(() => Promise.resolve());
  });

  describe('#execute()', () => {
    it('should clone the project repository to destination', () => {
      return handler.execute({ name: 'application', destination: 'path/to/application' }, {}, console)
        .then(() => {
          expect(cloneStub.calledOnce).to.be.true;
        });
    });
  });
});
