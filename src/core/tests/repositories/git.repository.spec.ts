import {Repository} from '../../../common/interfaces/repository.interface';
import {GitRepository} from '../../repositories/git.repository';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {FileSytemUtils} from '../../utils/file-system.utils';
import {GitUtils} from '../../utils/git.utils';
import * as path from 'path';
import {LoggerService} from '../../loggers/logger.service';

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
    rmdirStub = sandbox.stub(FileSytemUtils, 'rmdir').callsFake(() => Promise.resolve());
  });

  describe('#clone()', () => {
    it('should clone the git remote repository to destination', done => {
      repository.clone()
        .then(() => {
          expect(cloneStub.calledWith('remote', 'destination')).to.be.true;
          done();
        })
        .catch(done);
    });

    it('should remove the .git folder from destination', done => {
      repository.clone()
        .then(() => {
          expect(rmdirStub.calledWith(path.join('destination', '.git'))).to.be.true;
          done();
        })
        .catch(done);
    });
  });
});
