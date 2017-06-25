import {GenerateCommandHandler} from '../generate-command.handler';
import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import * as sinon from 'sinon';
import {ModuleProcessor} from '../../../core/assets/processors/module.processor';
import {ControllerProcessor} from '../../../core/assets/processors/controller.processor';
import {ComponentProcessor} from '../../../core/assets/processors/component.processor';
import {ConfigurationService} from '../../../core/configuration/configuration.service';

describe('GenerateCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let handler: CommandHandler;
  beforeEach(() => {
    handler = new GenerateCommandHandler();
  });

  let loadStub: sinon.SinonStub;
  let getPropertyStub: sinon.SinonStub;
  beforeEach(() => {
    loadStub = sandbox.stub(ConfigurationService, 'load').callsFake(() => Promise.resolve());
    getPropertyStub = sandbox.stub(ConfigurationService, 'getProperty').callsFake(() => 'ts')
  });

  describe('#execute()', () => {
    it('should load the configuration file', () => {
      sandbox.stub(ModuleProcessor.prototype, 'process').callsFake(() => Promise.resolve());
      return handler.execute({ assetType: 'module', assetName: 'name' }, {}, console)
        .then(() => {
          sinon.assert.calledOnce(loadStub);
        });
    });

    it('should get the project language from the configuration', () => {
      sandbox.stub(ModuleProcessor.prototype, 'process').callsFake(() => Promise.resolve());
      return handler.execute({ assetType: 'module', assetName: 'name' }, {}, console)
        .then(() => {
          sinon.assert.calledWith(getPropertyStub, 'language');
        });
    });

    it('should generate module assets', () => {
      let processStub = sandbox.stub(ModuleProcessor.prototype, 'process').callsFake(() => Promise.resolve());
      return handler.execute({ assetType: 'module', assetName: 'name' }, {}, console)
        .then(() => {
          sinon.assert.calledOnce(processStub);
        });
    });

    it('should generate controller assets', () => {
      let processStub = sandbox.stub(ControllerProcessor.prototype, 'process').callsFake(() => Promise.resolve());
      return handler.execute({ assetType: 'controller', assetName: 'name' }, {}, console)
        .then(() => {
          sinon.assert.calledOnce(processStub);
        });
    });

    it('should generate component assets', () => {
      let processStub = sandbox.stub(ComponentProcessor.prototype, 'process').callsFake(() => Promise.resolve());
      return handler.execute({ assetType: 'component', assetName: 'name' }, {}, console)
        .then(() => {
          sinon.assert.calledOnce(processStub);
        });
    });
  });
});
