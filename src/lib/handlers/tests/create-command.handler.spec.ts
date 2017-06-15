import {CreateCommandHandler} from '../create-command.handler';
import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {GitRepository} from '../../../core/project/repositories/git.repository';
import {FileSystemUtils} from '../../../core/utils/file-system.utils';

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
    sandbox.stub(FileSystemUtils, 'readdir').callsFake(() => Promise.resolve([]));
  });

  describe('#execute()', () => {
    it('should clone the project repository to destination', () => {
      return handler.execute({ name: 'application', destination: 'path/to/application' }, {}, console)
        .then(() => {
          sinon.assert.calledOnce(cloneStub);
        });
    });
  });
});
