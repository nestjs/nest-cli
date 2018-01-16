import * as sinon from 'sinon';
import { expect } from 'chai';
import { Asset } from '../asset';
import * as path from 'path';
import * as fs from 'fs';
import { ModuleEmitter } from '../module.emitter';

describe('ModuleEmitter', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let writeFileStub: sinon.SinonStub;
  beforeEach(() => {
    writeFileStub = sandbox.stub(fs, 'writeFile').callsFake((filename, content, callback) => callback(null));
  });

  let emitter: ModuleEmitter;
  beforeEach(() => emitter = new ModuleEmitter());
  describe('#emit()', () => {
    it('can call emit()', () => {
      expect(emitter.emit).to.exist;
    });
    it('should write the module file', async () => {
      const module: Asset = {
        name: 'name',
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
      };
      await emitter.emit(module);
      sandbox.assert.calledWith(writeFileStub, path.join(module.directory, module.filename), module.template.content);
    });
  });
});
