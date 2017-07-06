import {NpmUtils} from '../npm.utils';
import * as sinon from 'sinon';
import * as child_process from 'child_process';
import {Duplex, PassThrough} from 'stream';

describe('NpmUtils', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let spawnStub: sinon.SinonStub;
  beforeEach(() => {
    spawnStub = sandbox.stub(child_process, 'spawn').callsFake(() => {
      const stream: Duplex = new PassThrough();
      stream.end();
      return stream;
    })
  });

  describe('#update()', () => {
    it('should spawn a child process to update package.json dependencies', () => {
      NpmUtils.update()
        .then(() => {
          sinon.assert.calledWith(spawnStub, 'npm', [
            'update',
            '--save'
          ]);
        });
    });
  });
});
