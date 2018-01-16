import * as sinon from 'sinon';
import {Clean} from '../clean';
import * as os from 'os';
import * as path from 'path';
import { FileSystemUtils } from '../../../src/utils/file-system.utils';

describe('Clean', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let statStub: sinon.SinonStub;
  let rmStub: sinon.SinonStub;
  let rmdirStub: sinon.SinonStub;
  let readdirStub: sinon.SinonStub;
  let platformStub: sinon.SinonStub;
  beforeEach(() => {
    statStub = sandbox.stub(FileSystemUtils, 'stat');
    rmStub = sandbox.stub(FileSystemUtils, 'rm');
    rmdirStub = sandbox.stub(FileSystemUtils, 'rmdir');
    readdirStub = sandbox.stub(FileSystemUtils, 'readdir');
    platformStub = sandbox.stub(os, 'platform');
  });

  describe('#execute()', () => {
    context('Unix platform', () => {
      const argv: string[] = [ 'node_process_call', 'script_call', 'filename1', 'filename2', 'filename3' ];

      beforeEach(() => {
        platformStub.callsFake(() => 'unix');
      });

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

    context('win32 platform', () => {
      const argv: string[] = [ 'node_process_call', 'script_call', 'directory/*' ];
      beforeEach(() => {
        platformStub.callsFake(() => 'win32');
        rmdirStub.callsFake(() => Promise.resolve());
        rmStub.callsFake(() => Promise.resolve());
        readdirStub.callsFake(() => Promise.resolve([
          'filename1',
          'filename2',
          'filename3'
        ]));
      });

      it('should extract files from directory', () => {
        statStub.callsFake(() => Promise.resolve({
          isFile: () => false
        }));
        return Clean.execute(argv)
          .then(() => {
            sinon.assert.called(readdirStub);
          });
      });

      it('should remove * on win32 platform', () => {
        statStub.callsFake(() => Promise.resolve({
          isFile: () => true
        }));

        return Clean.execute(argv)
          .then(() => {
            sinon.assert.calledThrice(statStub);
            sinon.assert.calledWith(statStub, path.join('directory', 'filename1'));
            sinon.assert.calledWith(statStub, path.join('directory', 'filename2'));
            sinon.assert.calledWith(statStub, path.join('directory', 'filename3'));
          });
      });
    });
  });
});
