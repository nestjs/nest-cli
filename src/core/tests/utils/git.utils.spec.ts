import * as child_process from 'child_process';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {GitUtils} from '../../utils/git.utils';

describe('GitUtils', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let execStub: sinon.SinonStub;
  beforeEach(() => {
    execStub = sandbox.stub(child_process, 'exec').callsFake((command, callback) => callback());
  });

  it('should call the git system command with the expected inputs', () => {
    return GitUtils.clone('remote', 'destination')
      .then(() => {
        expect(execStub.calledWith(`git clone remote destination`));
      });
  });

});
