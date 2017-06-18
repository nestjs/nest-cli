import {GenerateCommandHandler} from '../generate-command.handler';
import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import {AssetGenerator} from '../../../core/assets/generators/asset.generator';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {Asset} from '../../../common/asset/interfaces/asset.interface';
import {AssetBuilder} from '../../../core/assets/builders/asset.builder';
import {FileNameBuilder} from '../../../core/assets/builders/file-name.builder';
import {AssetEnum} from '../../../common/asset/enums/asset.enum';
import {ClassNameBuilder} from '../../../core/assets/builders/class-name.builder';
import * as path from 'path';
import {ModuleProcessor} from '../../../core/assets/processors/module.processor';

describe('GenerateCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let handler: CommandHandler;
  beforeEach(() => {
    handler = new GenerateCommandHandler();
  });

  describe('#execute()', () => {
    it('should generate module assets', () => {
      let processStub = sandbox.stub(ModuleProcessor.prototype, 'process').callsFake(() => Promise.resolve());
      return handler.execute({ asset: 'module', name: 'name' }, {}, console)
        .then(() => {
          sinon.assert.calledOnce(processStub);
        });
    });

    it.skip('should generate controller assets', () => {
      return handler.execute({ asset: 'controller', name: 'name' }, {}, console)
        .then(() => {
        });
    });

    it.skip('should generate component assets', () => {
      return handler.execute({ asset: 'component', name: 'name' }, {}, console)
        .then(() => {
        });
    });
  });
});
