import * as sinon from 'sinon';
import { expect } from 'chai';
import { Asset } from '../asset.generator';
import { TemplateId } from '../template.replacer';
import * as path from 'path';
import { AssetRegister } from '../asset.register';

describe('AssetRegister', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let register: AssetRegister;
  beforeEach(() => register = new AssetRegister());
  describe('#register()', () => {
    it('can call register()', () => {
      expect(register.register).to.exist
    });
    it('should return the asset with module updated content', () => {
      const asset: Asset = {
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
      };
      expect(register.register(asset)).to.be.deep.equal({
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
            'import { NameController } from \'./name.controller\';\n' +
            '\n' +
            `@Module(${ JSON.stringify({
              controllers: [ 'NameController' ]
            }, null, 2).replace(/"/g, '')})\n` +
            'export class NameModule {}\n'
          }
        }
      });
    });
  });
});
