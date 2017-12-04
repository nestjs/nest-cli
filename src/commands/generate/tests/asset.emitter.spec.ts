import * as sinon from 'sinon';
import { Asset } from '../asset.generator';
import { TemplateId } from '../template.replacer';
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
    const name = 'name';
    const assets: Asset[] = [
      {
        path: 'name.type.ts',
        template: {
          id: TemplateId.MAIN,
          content: 'content'
        }
      },
      {
        path: 'name.type.spec.ts',
        template: {
          id: TemplateId.SPEC,
          content: 'content'
        }
      }
    ];
    it('should check if asset directory exists', async () => {
      statStub.callsFake((filename, callback) => callback(null, { isDirectory: () => true }));
      await emitter.emit(name, assets);
      sandbox.assert.calledWith(statStub, path.join(process.cwd(), 'src/modules', name));
    });
    it('should create asset directory if it does not exist', async () => {
      statStub.callsFake((filename, callback) => callback(new Error('File not exists')));
      await emitter.emit(name, assets);
      sandbox.assert.calledWith(mkdirStub, path.join(process.cwd(), 'src/modules', name));
    });
    it('should not create asset directory if it already exists', async () => {
      statStub.callsFake((filename, callback) => callback(null, { isDirectory: () => true }));
      await emitter.emit(name, assets);
      sandbox.assert.notCalled(mkdirStub);
    });
    it('should write asset files in the right place', async () => {
      statStub.callsFake((filename, callback) => callback(null, { isDirectory: () => true }));
      await emitter.emit(name, assets);
      sandbox.assert.calledWith(writeFileStub, path.join(process.cwd(), 'src/modules', name, assets[0].path), assets[0].template.content);
      sandbox.assert.calledWith(writeFileStub, path.join(process.cwd(), 'src/modules', name, assets[1].path), assets[1].template.content);
    });
  });
});
