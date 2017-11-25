import * as sinon from 'sinon';
import * as child_process from 'child_process';
import { GitRepository } from '../git.repository';
import { FileSystemUtils } from '../../core/utils/file-system.utils';
import * as path from 'path';

describe('GitRepository', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let repository: GitRepository;
  beforeEach(() => {
    const remote = 'remote';
    const local = 'local';
    repository = new GitRepository(remote, local);
  });

  let execStub: sinon.SinonStub;
  let rmdirStub: sinon.SinonStub;
  let rmStub: sinon.SinonStub;
  beforeEach(() => {
    execStub = sandbox.stub(child_process, 'exec')
      .callsFake((command, callback) => callback());
    rmdirStub = sandbox.stub(FileSystemUtils, 'rmdir').callsFake(() => Promise.resolve());
    rmStub = sandbox.stub(FileSystemUtils, 'rm').callsFake(() => Promise.resolve());
  });
  describe('#clone()', () => {
    it('should execute git clone command', async () => {
      await repository.clone();
      sandbox.assert.calledOnce(execStub);
    });
    it('should remove .git folder from local clone', async () => {
      await repository.clone();
      sandbox.assert.calledWith(rmdirStub, path.resolve('local', '.git'));
    });
    it('should remove .gitignore file from local clone', async () => {
      await repository.clone();
      sandbox.assert.calledWith(rmStub, path.resolve('local', '.gitignore'));
    });
  });
});
