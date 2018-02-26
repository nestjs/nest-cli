import * as sinon from 'sinon';
import { Asset } from '../asset';
import * as path from 'path';
import { AssetEmitter } from '../asset.emitter';
import * as fs from 'fs';

describe('AssetEmitter', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let statStub: sinon.SinonStub;
  let mkdirStub: sinon.SinonStub;
  let writeFileStub: sinon.SinonStub;
  beforeEach(() => {
    statStub = sandbox.stub(fs, 'stat');
    mkdirStub = sandbox.stub(fs, 'mkdir').callsFake((filename, callback) => callback());
    writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((filename, content, callback) => callback());
  });

  let emitter: AssetEmitter;
  beforeEach(() => emitter = new AssetEmitter());
  describe('#emit()', () => {
    const asset: Asset = {
      type: 'type',
      name: 'name',
      template: {
        name: 'type.ts.template',
        content: 'content'
      },
      className: 'NameType',
      directory: path.join(process.cwd(), 'src/modules', 'name'),
      filename: 'name.type.ts'
    };
    it('should check if asset directory exists', async () => {
      statStub.callsFake((filename, callback) => callback(null, { isDirectory: () => true }));
      await emitter.emit(asset);
      sandbox.assert.calledWith(statStub, asset.directory);
    });
    it('should create asset directory if it does not exist', async () => {
      statStub.callsFake((filename, callback) => callback(new Error('File not exists')));
      await emitter.emit(asset);
      sandbox.assert.calledWith(mkdirStub, asset.directory);
    });
    it('should not create asset directory if it already exists', async () => {
      statStub.callsFake((filename, callback) => callback(null, { isDirectory: () => true }));
      await emitter.emit(asset);
      sandbox.assert.notCalled(mkdirStub);
    });
    it('should write asset files in the right place', async () => {
      statStub.callsFake((filename, callback) => callback(null, { isDirectory: () => true }));
      await emitter.emit(asset);
      sandbox.assert.calledWith(writeFileStub, path.join(asset.directory, asset.filename), asset.template.content);
    });
  });
});
