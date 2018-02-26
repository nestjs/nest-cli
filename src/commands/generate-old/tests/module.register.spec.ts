import { expect } from 'chai';
import { Asset } from '../asset';
import * as path from "path";
import { ModuleRegister } from '../module.register';

describe('ModuleRegister', () => {
  let register: ModuleRegister;
  beforeEach(() => register = new ModuleRegister());
  describe('#register()', () => {
    it('should return the asset module registered copy', () => {
      const asset: Asset = {
        type: 'controller',
        name: 'name',
        template: {
          name: 'controller.ts.template',
          content: 'content'
        },
        className: 'NameController',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.controller.ts'
      };
      const module: Asset = {
        name: 'name',
        type: 'module',
        directory: path.resolve(process.cwd(), 'src/modules', 'name'),
        filename: 'name.module.ts',
        template: {
          content:
          'import { Module } from \'@nestjs/common\';\n' +
          '\n' +
          '@Module({})\n' +
          'export class NameModule {}\n'
        }
      };
      const registeredModule: Asset = register.register(asset, module);
      expect(registeredModule).to.be.deep.equal({
        type: 'module',
        name: 'name',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.module.ts',
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
      });
    });
  });
});
