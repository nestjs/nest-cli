import {GitRepository} from '../../repositories';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {FileSystemUtils, GitUtils} from '../../../utils';
import * as path from 'path';
import {Repository} from '../../../../common/project/interfaces/repository.interface';

describe('GitRepository', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let repository: Repository;
  beforeEach(() => repository = new GitRepository('remote', 'destination'));

  let cloneStub: sinon.SinonStub;
  let rmdirStub: sinon.SinonStub;
  beforeEach(() => {
    cloneStub = sandbox.stub(GitUtils, 'clone').callsFake(() => Promise.resolve());
    rmdirStub = sandbox.stub(FileSystemUtils, 'rmdir').callsFake(() => Promise.resolve());
  });

  describe('#clone()', () => {
    it('should clone the git remote repository to destination', () => {
      return repository.clone()
        .then(() => {
          expect(cloneStub.calledWith('remote', 'destination')).to.be.true;
        });
    });

    it('should remove the .git folder from destination', () => {
      return repository.clone()
        .then(() => {
          expect(rmdirStub.calledWith(path.join('destination', '.git'))).to.be.true;
        });
    });
  });
});
