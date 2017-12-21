import * as sinon from 'sinon';
import { expect } from 'chai';
import { Asset } from '../asset';
import * as path from 'path';
import * as fs from 'fs';
import { ModuleLoader } from '../module.loader';

describe('ModuleLoader', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let readdirStub: sinon.SinonStub;
  let readFileStub: sinon.SinonStub;
  beforeEach(() => {
    readdirStub = sandbox.stub(fs, 'readdir');
    readFileStub = sandbox.stub(fs, 'readFile');
  });

  let loader: ModuleLoader;
  beforeEach(() => loader = new ModuleLoader());
  describe('#load()', () => {
    context('not from a module asset', () => {
      const asset: Asset = {
        type: 'controller',
        name: 'name',
        template: {
          name: 'type.ts.template',
          content: 'content'
        },
        className: 'NameController',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.controller.ts'
      };
      context('module file exists in the asset directory', () => {
        beforeEach(() => {
          readdirStub.callsFake((dirname, callback) => callback(null, [ 'name.module.ts' ]));
          readFileStub.callsFake((filename, callback) => callback(null, Buffer.from(
            'import { Module } from \'@nestjs/common\';\n' +
            '\n' +
            '@Module({})\n' +
            'export class NameModule {}\n'
          )));
        });
        it('should read the asset directory', async () => {
          await loader.load(asset);
          sandbox.assert.calledWith(readdirStub, asset.directory);
        });
        it('should read the module file in the asset directory', async () => {
          await loader.load(asset);
          sandbox.assert.calledWith(readFileStub, path.join(asset.directory, 'name.module.ts'));
        });
        it('should return module definition', async () => {
          expect(await loader.load(asset)).to.be.deep.equal({
            name: '',
            type: 'module',
            directory: path.resolve(process.cwd(), 'src/modules', 'name'),
            filename: 'name.module.ts',
            template: {
              name: '',
              content:
              'import { Module } from \'@nestjs/common\';\n' +
              '\n' +
              '@Module({})\n' +
              'export class NameModule {}\n'
            }
          });
        });
      });
      context('module file does not exist in the asset directory', () => {
        beforeEach(() => {
          readdirStub.callsFake((dirname, callback) => {
            if (dirname === asset.directory) {
              callback(null, [ ])
            } else {
              callback(null, [ 'app.module.ts' ])
            }
          });
          readFileStub.callsFake((filename, callback) => callback(null, Buffer.from(
            'import { Module } from \'@nestjs/common\';\n' +
            '\n' +
            '@Module({})\n' +
            'export class AppModule {}\n'
          )));
        });
        it('should read the asset directory', async () => {
          await loader.load(asset);
          sandbox.assert.calledWith(readdirStub, asset.directory);
        });
        it('should read the parent asset directory', async () => {
          await loader.load(asset);
          sandbox.assert.calledWith(readdirStub, path.resolve(process.cwd(), 'src/modules'));
        });
        it('should return module definition', async () => {
          expect(await loader.load(asset)).to.be.deep.equal({
            name: '',
            type: 'module',
            directory: path.resolve(process.cwd(), 'src/modules'),
            filename: 'app.module.ts',
            template: {
              name: '',
              content:
              'import { Module } from \'@nestjs/common\';\n' +
              '\n' +
              '@Module({})\n' +
              'export class AppModule {}\n'
            }
          });
        });
      });
    });
    context('from a module asset', () => {
      const asset: Asset = {
        type: 'module',
        name: 'name',
        template: {
          name: 'module.ts.template',
          content: 'content'
        },
        className: 'NameModule',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.module.ts'
      };
      beforeEach(() => {
        readdirStub.callsFake((directory, callback) => {
          if (directory === asset.directory) {
            callback(null, [ 'name.module.ts' ])
          } else {
            callback(null, [ 'app.module.ts' ])
          }
        });
        readFileStub.callsFake((filename, callback) => callback(null, Buffer.from(
          'import { Module } from \'@nestjs/common\';\n' +
          '\n' +
          '@Module({})\n' +
          'export class AppModule {}\n'
        )));
      });
      it('should read the asset directory', async () => {
        await loader.load(asset);
        sandbox.assert.calledWith(readdirStub, asset.directory);
      });
      it('should read the parent asset directory', async () => {
        await loader.load(asset);
        sandbox.assert.calledWith(readdirStub, path.resolve(process.cwd(), 'src/modules'));
      });
      it('should return module definition', async () => {
        expect(await loader.load(asset)).to.be.deep.equal({
          name: '',
          type: 'module',
          directory: path.resolve(process.cwd(), 'src/modules'),
          filename: 'app.module.ts',
          template: {
            name: '',
            content:
            'import { Module } from \'@nestjs/common\';\n' +
            '\n' +
            '@Module({})\n' +
            'export class AppModule {}\n'
          }
        });
      });
    });
  });
});
