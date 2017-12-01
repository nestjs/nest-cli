import * as sinon from 'sinon';
import * as fs from 'fs';
import {expect} from 'chai';
import {FileSystemUtils} from '../file-system.utils';
import {rmdir, Stats} from 'fs';
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
    const target: string = path.normalize('path/to/target');

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
          sinon.assert.calledWith(statStub, path.normalize('/path'));
          sinon.assert.calledWith(statStub, path.normalize('/path/to'));
          sinon.assert.calledWith(statStub, path.normalize('/path/to/target'));
          sinon.assert.callCount(mkdirStub, 3);
          sinon.assert.calledWith(mkdirStub, path.normalize('/path'));
          sinon.assert.calledWith(mkdirStub, path.normalize('/path/to'));
          sinon.assert.calledWith(mkdirStub, path.normalize('/path/to/target'));
        });
    });
  });

  describe('#rmdir()', () => {
    const filename = 'path/to/dir';

    let fsrmdirStub: sinon.SinonStub;
    let readdirStub: sinon.SinonStub;
    let rmStub: sinon.SinonStub;
    beforeEach(() => {
      fsrmdirStub = sandbox.stub(fs, 'rmdir');
      readdirStub = sandbox.stub(FileSystemUtils, 'readdir');
      rmStub = sandbox.stub(FileSystemUtils, 'rm');
    });

    it('should delete the directory', () => {
      fsrmdirStub.callsFake((filename, callback) => callback(null));
      return FileSystemUtils.rmdir(filename)
        .then(() => {
          sinon.assert.calledOnce(fsrmdirStub);
        });
    });

    it('should delete the directory files and delete the directory after', () => {
      fsrmdirStub.callsFake((filename, callback) => {
        if (fsrmdirStub.callCount === 1)
          callback(new Error());
        else
          callback(null);
      });
      readdirStub.callsFake(() => Promise.resolve([
        'filename1',
        'filename2',
        'filename3'
      ]));
      rmStub.callsFake(() => Promise.resolve());
      return FileSystemUtils.rmdir(filename)
        .then(() => {
          sinon.assert.calledWith(fsrmdirStub, filename);
          sinon.assert.calledWith(fsrmdirStub, filename);
          sinon.assert.calledWith(readdirStub, filename);
          sinon.assert.calledWith(rmStub, path.join(filename, 'filename1'));
          sinon.assert.calledWith(rmStub, path.join(filename, 'filename2'));
          sinon.assert.calledWith(rmStub, path.join(filename, 'filename3'));
        });
    });

    it('should delete the subdirectories and the directory after', () => {
      fsrmdirStub.callsFake((filename, callback) => {
        if (fsrmdirStub.callCount < 3)
          callback(new Error());
        else
          callback(null);
      });
      readdirStub.callsFake(dir => {
        if (dir === filename)
          return Promise.resolve(['sub-dir']);
        else
          return Promise.resolve([
            'filename1',
            'filename2',
            'filename3'
          ]);
      });
      rmStub.callsFake(file => {
        if (file === path.join(filename, 'sub-dir'))
          return Promise.reject(new Error());
        else
          return Promise.resolve();
      });
      return FileSystemUtils.rmdir(filename)
        .then(() => {
          sinon.assert.callCount(fsrmdirStub, 4);
          sinon.assert.callCount(readdirStub, 2);
          sinon.assert.callCount(rmStub, 4);
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
      readFileStub.callsFake((filename, callback) => callback(null, Buffer.from('content')));
      const filename: string = 'filename';
      return FileSystemUtils.readFile(filename);
    });

    it('should return the read file content', () => {
      readFileStub.callsFake((filename, callback) => callback(null, Buffer.from('content')));
      const filename: string = 'filename';
      return FileSystemUtils.readFile(filename)
        .then(() => {
          sinon.assert.calledOnce(readFileStub);
        });
    });

    it('should reject an error if something wrong', () => {
      readFileStub.callsFake((filename, callback) => callback('reject message', null));
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
