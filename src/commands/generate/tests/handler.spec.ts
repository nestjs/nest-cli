import * as sinon from 'sinon';
import { GenerateHandler } from '../handler';
import { GenerateArguments } from '../command';
import { AssetGenerator } from '../asset.generator';
import { LoggerService } from '../../../logger/logger.service';
import { Asset } from '../asset';
import { ConfigurationLoader } from '../../../configuration/configuration.loader';
import { TemplateLoader } from '../template.loader';
import { TokensGenerator } from '../tokens.generator';
import * as path from "path";
import { TemplateReplacer } from '../template.replacer';
import { TokenName } from '../token';
import { AssetEmitter } from '../asset.emitter';
import { ModuleLoader } from '../module.loader';
import { ModuleRegister } from '../module.register';
import { ModuleEmitter } from '../module.emitter';

describe('GenerateHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let getPropertyStub: sinon.SinonStub;
  let templateLoadStub: sinon.SinonStub;
  let assetGenerateSpy: sinon.SinonSpy;
  let tokensGenerateSpy: sinon.SinonSpy;
  let replaceSpy: sinon.SinonSpy;
  let emitStub: sinon.SinonStub;
  let moduleLoadStub: sinon.SinonStub;
  let moduleRegisterSpy: sinon.SinonSpy;
  let moduleEmitterStub: sinon.SinonStub;
  beforeEach(() => {
    LoggerService.setLogger({
      debug: () => {},
      error: () => {},
      info: () => {},
      log: () => {},
      warn: () => {}
    });
    getPropertyStub = sandbox.stub(ConfigurationLoader, 'getProperty').callsFake(() => 'ts');
    templateLoadStub = sandbox.stub(TemplateLoader.prototype, 'load').callsFake(() => Promise.resolve([
      {
        name: 'controller.ts.template',
        content: ''
      }
    ]));
    assetGenerateSpy = sandbox.spy(AssetGenerator.prototype, 'generate');
    tokensGenerateSpy = sandbox.spy(TokensGenerator.prototype, 'generate');
    replaceSpy = sandbox.spy(TemplateReplacer.prototype, 'replace');
    emitStub = sandbox.stub(AssetEmitter.prototype, 'emit').callsFake(() => Promise.resolve());
    moduleLoadStub = sandbox.stub(ModuleLoader.prototype, 'load').callsFake(() => Promise.resolve({
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
    }));
    moduleRegisterSpy = sandbox.spy(ModuleRegister.prototype, 'register');
    moduleEmitterStub = sandbox.stub(ModuleEmitter.prototype, 'emit').callsFake(() => Promise.resolve());
  });

  let handler: GenerateHandler;
  beforeEach(() => handler = new GenerateHandler());
  describe('#handle()', () => {
    const args: GenerateArguments = {
      type: 'controller',
      name: 'name'
    };
    it('should get language property from configuration', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(getPropertyStub, 'language');
    });
    it('should load type language templates', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(templateLoadStub, 'controller', 'ts');
    });
    it('should generate asset by loaded template', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(assetGenerateSpy, {
        name: 'name',
        type: 'controller',
        template: {
          name: 'controller.ts.template',
          content: ''
        }
      });
    });
    it('should generate tokens by asset', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(tokensGenerateSpy, {
        name: 'name',
        type: 'controller',
        template: {
          name: 'controller.ts.template',
          content: ''
        },
        className: 'NameController',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.controller.ts'
      });
    });
    it('should replace asset template tokens', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(replaceSpy,
        {
          name: 'controller.ts.template',
          content: ''
        },
        [
          {
            name: TokenName.CLASS_NAME,
            value: 'NameController'
          },
          {
            name: TokenName.SPEC_IMPORT,
            value: './name.controller'
          }
        ]
      )
    });
    it('should emit each asset', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(emitStub, {
        name: 'name',
        type: 'controller',
        template: {
          name: 'controller.ts.template',
          content: ''
        },
        className: 'NameController',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.controller.ts'
      });
    });
    it('should load the main asset module', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(moduleLoadStub, {
        name: 'name',
        type: 'controller',
        template: {
          name: 'controller.ts.template',
          content: ''
        },
        className: 'NameController',
        directory: path.join(process.cwd(), 'src/modules', 'name'),
        filename: 'name.controller.ts'
      });
    });
    it('should register asset into module', async () => {
      const asset: Asset = {
        name: 'name',
        type: 'controller',
        template: {
          name: 'controller.ts.template',
          content: ''
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
          name: '',
          content:
          'import { Module } from \'@nestjs/common\';\n' +
          '\n' +
          '@Module({})\n' +
          'export class NameModule {}\n'
        }
      };
      await handler.handle(args);
      sandbox.assert.calledWith(moduleRegisterSpy, asset);
    });
    it.skip('should emit the registered asset module', async () => {
      const module: Asset = {
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
      };
      await handler.handle(args);
      sandbox.assert.calledWith(moduleEmitterStub, module);
    });
  });
});
