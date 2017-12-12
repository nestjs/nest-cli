import * as sinon from 'sinon';
import { expect } from 'chai';
import { Asset } from '../asset.generator';
import * as path from 'path';
import { TemplateId } from '../template.replacer';
import * as fs from 'fs';
import { AssetModuleLoader } from '../asset-module.loader';

describe('AssetModuleLoader', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let readdirStub: sinon.SinonStub;
  let readFileStub: sinon.SinonStub;
  beforeEach(() => {
    readdirStub = sandbox.stub(fs, 'readdir');
    readFileStub = sandbox.stub(fs, 'readFile');
    readdirStub.callsFake((dirname, callback) => callback(null, [ 'name.module.ts' ]));
    readFileStub.callsFake((filename, callback) => callback(null, Buffer.from(
      'import { Module } from \'@nestjs/common\';\n' +
      '\n' +
      '@Module({})\n' +
      'export class NameModule {}\n'
    )));
  });

  let loader: AssetModuleLoader;
  beforeEach(() => loader = new AssetModuleLoader());
  describe('#load()', () => {
    const asset: Asset = {
      className: 'NameController',
      type: 'controller',
      name: 'name',
      path: path.resolve(process.cwd(), 'src/modules/name/name.controller.ts'),
      template: {
        id: TemplateId.MAIN,
        content: 'content'
      }
    };
    it('should read the asset directory', async () => {
      await loader.load(asset);
      sandbox.assert.calledWith(readdirStub, path.dirname(asset.path));
    });
    it('should read the module file in the asset directory if it exist', async () => {
      await loader.load(asset);
      sandbox.assert.calledWith(readFileStub, path.join(path.dirname(asset.path), 'name.module.ts'));
    });
    it('should return a copy of the asset with module asset', async () => {
      expect(await loader.load(asset)).to.be.deep.equal({
        className: 'NameController',
        type: 'controller',
        name: 'name',
        path: path.resolve(process.cwd(), 'src/modules/name/name.controller.ts'),
        template: {
          id: TemplateId.MAIN,
          content: 'content'
        },
        module: {
          path: path.resolve(process.cwd(), 'src/modules/name/name.module.ts'),
          template: {
            content:
            'import { Module } from \'@nestjs/common\';\n' +
            '\n' +
            '@Module({})\n' +
            'export class NameModule {}\n'
          }
        }
      });
    });
  });
});
