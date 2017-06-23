import * as sinon from 'sinon';
import {expect} from 'chai';
import * as path from 'path';
import {Repository} from '../../../../common/project/interfaces/repository.interface';
import {GitRepository} from '../git.repository';
import {GitUtils} from '../../../utils/git.utils';
import {FileSystemUtils} from '../../../utils/file-system.utils';

describe('GitRepository', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let repository: Repository;
  beforeEach(() => repository = new GitRepository('remote', 'destination'));

  let cloneStub: sinon.SinonStub;
  let rmdirStub: sinon.SinonStub;
  let rmStub: sinon.SinonStub;
  beforeEach(() => {
    cloneStub = sandbox.stub(GitUtils, 'clone').callsFake(() => Promise.resolve());
    rmdirStub = sandbox.stub(FileSystemUtils, 'rmdir').callsFake(() => Promise.resolve());
    rmStub = sandbox.stub(FileSystemUtils, 'rm').callsFake(() => Promise.resolve());
  });

  describe('#clone()', () => {
    it('should clone the git remote repository to destination', () => {
      return repository.clone()
        .then(() => {
          sinon.assert.calledWith(cloneStub, 'remote', 'destination');
        });
    });

    it('should remove the .git folder from destination', () => {
      return repository.clone()
        .then(() => {
          sinon.assert.calledWith(rmdirStub, path.join('destination', '.git'));
        });
    });

    it('should remove the .gitignore file from destination', () => {
      return repository.clone()
        .then(() => {
          sinon.assert.calledWith(rmStub, path.join('destination', '.gitignore'));
        });
    });
  });
});
