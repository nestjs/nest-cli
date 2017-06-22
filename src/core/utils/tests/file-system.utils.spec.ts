import * as sinon from 'sinon';
import * as fs from 'fs';
import {expect} from 'chai';
import {FileSystemUtils} from '../file-system.utils';
import {Stats} from 'fs';
import * as path from 'path';

describe('FileSystemUtils', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  describe('#stat()', () => {
    const filename: string = 'path/to/filename';

    let statStub: sinon.SinonStub;
    beforeEach(() => {
      statStub = sandbox.stub(fs, 'stat');
    });

    it('should return a Stat of filename', () => {
      statStub.callsFake((filename, callback) => callback(null, {}));
      return FileSystemUtils.stat(filename)
        .then((stat: Stats) => {
          expect(stat).to.not.be.undefined;
        });
    });

    it('should return the error', () => {
      statStub.callsFake((filename, callback) => callback(new Error('stat error'), null));
      return FileSystemUtils.stat(filename)
        .then(() => {
          throw new Error('should not be here');
        })
        .catch(error => {
          expect(error.message).to.be.equal('stat error');
        });
    });
  });

  describe('#mkdir()', () => {
    const target: string = 'path/to/target';

    let statStub: sinon.SinonStub;
    let resolveStub: sinon.SinonStub;
    let mkdirStub: sinon.SinonStub;
    beforeEach(() => {
      statStub = sandbox.stub(FileSystemUtils, 'stat').callsFake(() => Promise.reject('stat error'));
      resolveStub = sandbox.stub(path, 'resolve').callsFake((parent: string, child: string) => parent.concat(path.sep).concat(child));
      mkdirStub = sandbox.stub(fs, 'mkdir').callsFake((directoryName, callback) => callback());
    });

    it('should create recursively the path', () => {
      return FileSystemUtils.mkdir(target)
        .then(() => {
          sinon.assert.callCount(statStub, 3);
          sinon.assert.calledWith(statStub, '/path');
          sinon.assert.calledWith(statStub, '/path/to');
          sinon.assert.calledWith(statStub, '/path/to/target');
          sinon.assert.callCount(mkdirStub, 3);
          sinon.assert.calledWith(mkdirStub, '/path');
          sinon.assert.calledWith(mkdirStub, '/path/to');
          sinon.assert.calledWith(mkdirStub, '/path/to/target');
        });
    });
  });

  describe('#rmdir()', () => {
    const dirname = 'path/to/dir';

    let readdirStub: sinon.SinonStub;
    let rmdirStub: sinon.SinonStub;
    beforeEach(() => {
      readdirStub = sandbox.stub(FileSystemUtils, 'readdir');
      rmdirStub = sandbox.stub(fs, 'rmdir').callsFake((dirname, callback) => callback());
    });

    it('should read directory to check if it contains files', () => {
      readdirStub.callsFake(() => Promise.resolve([]));
      return FileSystemUtils.rmdir(dirname)
        .then(() => {
          sinon.assert.calledOnce(readdirStub);
        });
    });

    it('should remove the diretory from the file system if no files or subdirectories inside', () => {
      readdirStub.callsFake(() => Promise.resolve([]));
      return FileSystemUtils.rmdir(dirname)
        .then(() => {
          sinon.assert.calledOnce(rmdirStub);
        });
    });

    it('should remove each files from directory before deleting it', () => {
      readdirStub.callsFake(() => Promise.resolve([
        'filename1.ext',
        'filename2.ext',
        'filename3.ext',
      ]));
      const rmStub: sinon.SinonStub = sandbox.stub(FileSystemUtils, 'rm').callsFake(() => Promise.resolve());
      return FileSystemUtils.rmdir(dirname)
        .then(() => {
          sinon.assert.callCount(rmStub, 3);
          sinon.assert.calledWith(rmStub, path.join(dirname, 'filename1.ext'));
          sinon.assert.calledWith(rmStub, path.join(dirname, 'filename2.ext'));
        });
    });
  });

  describe('#readdir()', () => {
    let readdirStub: sinon.SinonStub;
    beforeEach(() => readdirStub = sandbox.stub(fs, 'readdir'));

    it('should return the files as a Promise from fs readdir method', () => {
      const readdirResult: string[] = [ 'filename1', 'filename2', 'filename3' ];
      readdirStub.callsFake((dirname, callback) => { callback(null, readdirResult)});
      return FileSystemUtils.readdir('path/to/dirName')
        .then(fileNames => {
          sinon.assert.calledWith(readdirStub, 'path/to/dirName');
          expect(fileNames).to.be.deep.equal(readdirResult);
        });
    });

    it('should reject the promise when fs readdir failed', () => {
      readdirStub.callsFake((dirname, callback) => { callback(new Error('readdir error message'), null)});
      return FileSystemUtils.readdir('path/to/dirname')
        .then(() => {
          throw new Error('should not be here');
        })
        .catch(error => {
          expect(error.message).to.be.equal('readdir error message');
        });
    });
  });

  describe('#rm()', () => {
    let unlinkStub: sinon.SinonStub;
    beforeEach(() => unlinkStub = sandbox.stub(fs, 'unlink').callsFake((filename, callback) => { callback(); }));

    it('should remove the file from the file system', () => {
      return FileSystemUtils.rm('path/to/file.ext')
        .then(() => {
          sinon.assert.calledOnce(unlinkStub);
        });
    });
  });

  describe('#readFile()', () => {
    let readFileStub: sinon.SinonStub;
    beforeEach(() => readFileStub = sandbox.stub(fs, 'readFile'));

    it('can call readFile()', () => {
      readFileStub.callsFake((filename, encoding, callback) => callback(null, Buffer.from('content')));
      const filename: string = 'filename';
      return FileSystemUtils.readFile(filename);
    });

    it('should return the read file content', () => {
      readFileStub.callsFake((filename, encoding, callback) => callback(null, Buffer.from('content')));
      const filename: string = 'filename';
      return FileSystemUtils.readFile(filename)
        .then(() => {
          sinon.assert.calledOnce(readFileStub);
        });
    });

    it('should reject an error if something wrong', () => {
      readFileStub.callsFake((filename, encoding, callback) => callback('reject message', null));
      const filename: string = 'filename';
      return FileSystemUtils.readFile(filename)
        .then(() => {
          throw new Error('should not be here');
        })
        .catch(error => {
          expect(error.message).to.not.be.equal('should not be here');
        });
    });
  });
});
