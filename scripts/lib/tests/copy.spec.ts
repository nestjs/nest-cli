import {Copy} from '../copy';
import * as sinon from 'sinon';
import * as fs from 'fs';
import {PassThrough} from 'stream';
import * as path from 'path';
import { FileSystemUtils } from '../../../src/utils/file-system.utils';

describe('Copy', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let statStub: sinon.SinonStub;
  let createReadStreamStub: sinon.SinonStub;
  let createWriteStreamStub: sinon.SinonStub;
  let pipeSpy: sinon.SinonSpy;
  let readdirStub: sinon.SinonStub;
  let mkdirStub: sinon.SinonStub;
  beforeEach(() => {
    statStub = sandbox.stub(FileSystemUtils, 'stat');
    createReadStreamStub = sandbox.stub(fs, 'createReadStream').callsFake(() => {
      const reader = new PassThrough();
      reader.end();
      return reader;
    });
    createWriteStreamStub = sandbox.stub(fs, 'createWriteStream').callsFake(() => new PassThrough());
    pipeSpy = sandbox.spy(PassThrough.prototype, 'pipe');
    readdirStub = sandbox.stub(FileSystemUtils, 'readdir');
    mkdirStub = sandbox.stub(FileSystemUtils, 'mkdir').callsFake(() => Promise.resolve());
  });

  describe('#execute()', () => {
    const argv: string[] = [ 'node_process_call', 'script_call', 'origin', 'destination' ];

    it('should evaluate if origin is a file', () => {
      statStub.callsFake(() => Promise.resolve({
        isFile: () => true
      }));
      return Copy.execute(argv)
        .then(() => {
          sinon.assert.calledWith(statStub, 'origin');
        });
    });

    context('origin is a file', () => {
      beforeEach(() => {
        statStub.callsFake(() => Promise.resolve({
          isFile: () => true
        }));
      });

      it('should open an input stream on origin file', () => {
        return Copy.execute(argv)
          .then(() => {
            sinon.assert.calledWith(createReadStreamStub, 'origin');
          });
      });

      it('should open an output stream to destination file', () => {
        return Copy.execute(argv)
          .then(() => {
            sinon.assert.calledWith(createWriteStreamStub, 'destination');
          });
      });

      it('should pipe origin to destination', () => {
        return Copy.execute(argv)
          .then(() => {
            sinon.assert.called(pipeSpy);
          });
      });
    });

    context('origin is directory', () => {
      beforeEach(() => {
        statStub.callsFake(filename => {
          if (filename === 'origin')
            return Promise.resolve({
              isFile: () => false
            });
          else
            return Promise.resolve({
              isFile: () => true
            });
        });
        readdirStub.callsFake(() => Promise.resolve([
          'filename1',
          'filename2',
          'filename3',
        ]));
      });

      it('should read the directory', () => {
        return Copy.execute(argv)
          .then(() => {
            sinon.assert.calledWith(readdirStub, 'origin');
          });
      });

      it('should copy each files in the directory to the destination', () => {
        return Copy.execute(argv)
          .then(() => {
            sinon.assert.calledThrice(createReadStreamStub);
            sinon.assert.calledWith(createReadStreamStub, path.join('origin', 'filename1'));
            sinon.assert.calledWith(createReadStreamStub, path.join('origin', 'filename2'));
            sinon.assert.calledWith(createReadStreamStub, path.join('origin', 'filename3'));
            sinon.assert.calledThrice(createWriteStreamStub);
            sinon.assert.calledWith(createWriteStreamStub, path.join('destination', 'filename1'));
            sinon.assert.calledWith(createWriteStreamStub, path.join('destination', 'filename2'));
            sinon.assert.calledWith(createWriteStreamStub, path.join('destination', 'filename3'));
            sinon.assert.calledThrice(pipeSpy);
          });
      });
    });

    context('origin contains sub directories', () => {
      beforeEach(() => {
        statStub.callsFake(filename => {
          if (filename === 'origin' || filename === 'origin/directory')
            return Promise.resolve({
              isFile: () => false
            });
          else
            return Promise.resolve({
              isFile: () => true
            });
        });
        readdirStub.callsFake(filename => {
          if (filename === 'origin')
            return Promise.resolve([ 'directory' ]);
          else
            return Promise.resolve([ 'filename']);
        });
      });

      it('create the intermediate directory before copy file', () => {
        return Copy.execute(argv)
          .then(() => {
            sinon.assert.called(mkdirStub);
          });
      });
    });
  });
});
