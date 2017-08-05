import * as sinon from 'sinon';
import {FileSystemUtils} from '../../../src/core/utils/file-system.utils';
import {Clean} from '../clean';

describe('Clean', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let statStub: sinon.SinonStub;
  let rmStub: sinon.SinonStub;
  let rmdirStub: sinon.SinonStub;
  beforeEach(() => {
    statStub = sandbox.stub(FileSystemUtils, 'stat');
    rmStub = sandbox.stub(FileSystemUtils, 'rm');
    rmdirStub = sandbox.stub(FileSystemUtils, 'rmdir');
  });

  describe('#execute()', () => {
    context('should delete all item from argv[1] to the end of argv array', () => {
      const argv: string[] = [ 'node_process_call', 'script_call', 'filename1', 'filename2', 'filename3' ];

      it('should call stat per file', () => {
        statStub.callsFake(() => Promise.resolve({
          isFile: () => true
        }));
        return Clean.execute(argv)
          .then(() => {
            sinon.assert.calledThrice(statStub);
            sinon.assert.calledWith(statStub, 'filename1');
            sinon.assert.calledWith(statStub, 'filename2');
            sinon.assert.calledWith(statStub, 'filename3');
          });
      });

      it('should call rm on files', () => {
        statStub.callsFake(() => Promise.resolve({
          isFile: () => true
        }));
        rmStub.callsFake(() => Promise.resolve());
        return Clean.execute(argv)
          .then(() => {
            sinon.assert.calledThrice(rmStub);
            sinon.assert.calledWith(rmStub, 'filename1');
            sinon.assert.calledWith(rmStub, 'filename2');
            sinon.assert.calledWith(rmStub, 'filename3');
          });
      });

      it('should call rmdir on directories', () => {
        rmdirStub.callsFake(() => Promise.resolve());
        statStub.callsFake(() => Promise.resolve({
          isFile: () => false
        }));
        return Clean.execute(argv)
          .then(() => {
            sinon.assert.calledThrice(rmdirStub);
            sinon.assert.calledWith(rmdirStub, 'filename1');
            sinon.assert.calledWith(rmdirStub, 'filename2');
            sinon.assert.calledWith(rmdirStub, 'filename3');
          });
      });
    });
  });
});
