import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationEmitter } from '../configuration.emitter';
import { LoggerService } from '../../../logger/logger.service';

describe('ConfigurationEmitter', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let statStub: sinon.SinonStub;
  let writeFileStub: sinon.SinonStub;
  beforeEach(() => {
    statStub = sandbox.stub(fs, 'stat');
    writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((filename, content, callback) => callback());
    LoggerService.setLogger({
      debug: () => {},
      error: () => {},
      info: () => {},
      log: () => {},
      warn: () => {}
    });
  });

  let emitter: ConfigurationEmitter;
  beforeEach(() => emitter = new ConfigurationEmitter());

  describe('#emit()', () => {
    it('should not emit configuration file if it already exists', async () => {
      statStub.callsFake((filename, callback) => callback(null, { isFile: () => true }));
      const name = 'name';
      await emitter.emit(name);
      sandbox.assert.calledWith(statStub, path.join(process.cwd(), name, 'nestconfig.json'));
      sandbox.assert.notCalled(writeFileStub);
    });
    it('should emit a default configuration file in root name project directory', async () => {
      statStub.callsFake((filename, callback) => callback(new Error('error message')));
      const name = 'name';
      await emitter.emit(name);
      sandbox.assert.calledWith(writeFileStub, path.join(process.cwd(), name, 'nestconfig.json'), JSON.stringify({ language: 'ts', entryFile: 'src/server.ts' }, null, 2));
    });
  });
});
