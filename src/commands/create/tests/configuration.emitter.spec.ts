import { expect } from 'chai';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationEmitter } from '../configuration.emitter';

describe('ConfigurationEmitter', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let writeFileStub: sinon.SinonStub;
  beforeEach(() => {
    writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((filename, content, callback) => callback());
  });

  let emitter: ConfigurationEmitter;
  beforeEach(() => emitter = new ConfigurationEmitter());

  describe('#emit()', () => {
    it('can call emit()', () => {
      expect(emitter.emit).to.exist;
    });
    it('should emit a default configuration file in root name project directory', async () => {
      const name = 'name';
      await emitter.emit(name);
      sandbox.assert.calledWith(writeFileStub, path.join(process.cwd(), name, 'nestconfig.json'), JSON.stringify({ language: 'ts', entryFile: 'src/server.ts' }, null, 2));
    });
  });
});
