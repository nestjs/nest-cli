import { expect } from 'chai';
import { Asset } from '../asset.generator';
import * as path from 'path';
import { TemplateId } from '../template.replacer';
import { ModuleImportRegister } from '../module-import.register';

describe('ModuleImportRegister', () => {
  let register: ModuleImportRegister;
  beforeEach(() => register = new ModuleImportRegister());
  describe('#register()', () => {
    it('should add asset import into asset module content', () => {
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
            '@Module({})\n' +
            'export class NameModule {}\n'
          }
        }
      });
    });
  });
});
