import * as sinon from 'sinon';
import * as child_process from 'child_process';
import { GitRepository } from '../git.repository';
import * as path from 'path';
import { FileSystemUtils } from '../../../utils/file-system.utils';
import { LoggerService } from '../../../logger/logger.service';

describe('GitRepository', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());


  let execStub: sinon.SinonStub;
  let rmdirStub: sinon.SinonStub;
  let rmStub: sinon.SinonStub;
  let readdirStub: sinon.SinonStub;
  beforeEach(() => {
    execStub = sandbox.stub(child_process, 'exec')
      .callsFake((command, callback) => callback());
    rmdirStub = sandbox.stub(FileSystemUtils, 'rmdir').callsFake(() => Promise.resolve());
    rmStub = sandbox.stub(FileSystemUtils, 'rm').callsFake(() => Promise.resolve());
    readdirStub = sandbox.stub(FileSystemUtils, 'readdir').callsFake(() => Promise.resolve([]));
    LoggerService.setLogger({
      debug: () => {},
      error: () => {},
      info: () => {},
      log: () => {},
      warn: () => {}
    });
  });

  let repository: GitRepository;
  beforeEach(() => {
    repository = new GitRepository();
  });

  describe('#clone()', () => {
    const remote = 'remote';
    const local = 'local';
    it('should execute git clone command', async () => {
      await repository.clone(remote, local);
      sandbox.assert.calledOnce(execStub);
    });
    it('should remove .git folder from local clone', async () => {
      await repository.clone(remote, local);
      sandbox.assert.calledWith(rmdirStub, path.resolve('local', '.git'));
    });
    it('should remove .gitignore file from local clone', async () => {
      await repository.clone(remote, local);
      sandbox.assert.calledWith(rmStub, path.resolve('local', '.gitignore'));
    });
    it('should list the created files', async () => {
      await repository.clone(remote, local);
      sandbox.assert.calledOnce(readdirStub);
    });
  });
});
