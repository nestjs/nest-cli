import { expect } from 'chai';
import { Asset } from '../asset.generator';
import * as path from "path";
import { TemplateId } from '../template.replacer';
import { ModuleMetadataRegister } from '../module-metadata.register';

describe('ModuleMetadataRegister', () => {
  let register: ModuleMetadataRegister;
  beforeEach(() => register = new ModuleMetadataRegister());
  describe('#register()', () => {
    it('should create controller metadata with the new controller', () => {
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
            'import { Module } from \'@nestjs/common\';\n\n' +
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
