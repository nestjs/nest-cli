import {NpmUtils} from '../npm.utils';
import * as sinon from 'sinon';
import * as child_process from 'child_process';
import {EventEmitter} from 'events';

describe('NpmUtils', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let spawnStub: sinon.SinonStub;
  let event: EventEmitter;
  beforeEach(() => {
    event = new EventEmitter();
    spawnStub = sandbox.stub(child_process, 'spawn').callsFake(() => {
      return event.addListener('exit', () => () => 0);
    });
  });

  describe('#update()', () => {
    it('should spawn a child process to update all dev dependencies', () => {
      const promise: Promise<void> = NpmUtils.update('-dev');
      event.emit('exit');
      return promise.then(() => {
        sinon.assert.calledWith(spawnStub, 'npm', [
          'update',
          '--save-dev'
        ]);
      });
    });

    it('should spawn a child process to update all production dependencies', () => {
      const promise: Promise<void> = NpmUtils.update();
      event.emit('exit');
      return promise.then(() => {
        sinon.assert.calledWith(spawnStub, 'npm', [
          'update',
          '--save'
        ]);
      });
    });

    it('should spawn a child process to update dependencies', () => {
      const promise: Promise<void> = NpmUtils.update('', [
        'dep1',
        'dep2',
        'dep3'
      ]);
      event.emit('exit');
      return promise.then(() => {
          sinon.assert.calledWith(spawnStub, 'npm', [
            'update',
            '--save',
            'dep1',
            'dep2',
            'dep3'
          ]);
        });
    });
  });

  describe('#uninstall()', () => {
    it('should spawn a child process to uninstall dependencies', () => {
      const promise: Promise<void> = NpmUtils.uninstall('', [
        'dep1',
        'dep2',
        'dep3'
      ]);
      event.emit('exit');
      return promise
        .then(() => {
          sinon.assert.calledWith(spawnStub, 'npm', [
            'uninstall',
            '--save',
            'dep1',
            'dep2',
            'dep3'
          ]);
        });
    });
  });

  describe('#install()', () => {
    it('should spawn a child process to install dependencies', () => {
      const promise: Promise<void> = NpmUtils.install('', [
        'dep1',
        'dep2',
        'dep3'
      ]);
      event.emit('exit');
      return promise
        .then(() => {
          sinon.assert.calledWith(spawnStub, 'npm', [
            'install',
            '--save',
            'dep1',
            'dep2',
            'dep3'
          ]);
        });
    });

    it('should spawn a child process to install dev dependencies', () => {
      const promise: Promise<void> = NpmUtils.install('-dev', [
        'dep1',
        'dep2',
        'dep3'
      ]);
      event.emit('exit');
      return promise
        .then(() => {
          sinon.assert.calledWith(spawnStub, 'npm', [
            'install',
            '--save-dev',
            'dep1',
            'dep2',
            'dep3'
          ]);
        });
    });
  });
});
