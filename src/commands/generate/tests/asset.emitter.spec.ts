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

  let mkdirStub: sinon.SinonStub;
  let writeFileStub: sinon.SinonStub;
  beforeEach(() => {
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
    it('should create asset directory', async () => {
      await emitter.emit(name, assets);
      sandbox.assert.calledWith(mkdirStub, path.join(process.cwd(), 'src/modules', 'name'));
    });
    it('should write asset files in the right place', async () => {
      await emitter.emit(name, assets);
      sandbox.assert.calledWith(writeFileStub, path.join(process.cwd(), 'src/modules','name', 'name.type.ts'), assets[0].template.content);
      sandbox.assert.calledWith(writeFileStub, path.join(process.cwd(), 'src/modules', 'name', 'name.type.spec.ts'), assets[1].template.content);
    });
  });
});
