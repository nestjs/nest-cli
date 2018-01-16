import { expect } from 'chai';
import { Asset } from '../asset';
import * as path from 'path';
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
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.controller.ts',
        template: {
          name: '',
          content: 'content'
        }
      };
      const module: Asset = {
        type: 'module',
        name: 'name',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.module.ts',
        template: {
          content:
          'import { Module } from \'@nestjs/common\';\n' +
          '\n' +
          '@Module({})\n' +
          'export class NameModule {}\n'
        }
      };
      expect(register.register(asset, module)).to.be.deep.equal({
        type: 'module',
        name: 'name',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.module.ts',
        template: {
          content:
          'import { Module } from \'@nestjs/common\';\n' +
          'import { NameController } from \'./name.controller\';\n' +
          '\n' +
          '@Module({})\n' +
          'export class NameModule {}\n'
        }
      });
    });
  });
});
