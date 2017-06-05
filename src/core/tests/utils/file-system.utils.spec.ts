import * as sinon from 'sinon';
import * as fs from 'fs';
import {expect} from 'chai';
import {FileSystemUtils} from '../../utils/file-system.utils';
import {Stats} from 'fs';

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
    it('can call mkdir()', () => {
      const path: string = 'path/to/folder';
      return FileSystemUtils.mkdir(path);
    });
    
  });

  describe('#rmdir()', () => {

  });
});
