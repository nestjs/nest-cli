import {GenerateCommandHandler} from '../generate-command.handler';
import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import * as sinon from 'sinon';
import {ModuleProcessor} from '../../../core/assets/processors/module.processor';
import {ControllerProcessor} from '../../../core/assets/processors/controller.processor';
import {ComponentProcessor} from '../../../core/assets/processors/component.processor';

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

    it('should generate controller assets', () => {
      let processStub = sandbox.stub(ControllerProcessor.prototype, 'process').callsFake(() => Promise.resolve());
      return handler.execute({ asset: 'controller', name: 'name' }, {}, console)
        .then(() => {
          sinon.assert.calledOnce(processStub);
        });
    });

    it('should generate component assets', () => {
      let processStub = sandbox.stub(ComponentProcessor.prototype, 'process').callsFake(() => Promise.resolve());
      return handler.execute({ asset: 'component', name: 'name' }, {}, console)
        .then(() => {
          sinon.assert.calledOnce(processStub);
        });
    });
  });
});
