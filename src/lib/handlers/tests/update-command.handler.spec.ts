import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import {UpdateCommandHandler} from '../update-command.handler';
import * as sinon from 'sinon';
import {LoggerService} from '../../../core/logger/logger.service';
import {UpdateCommandArguments} from '../../../common/program/interfaces/command.aguments.interface';
import {UpdateCommandOptions} from '../../../common/program/interfaces/command.options.interface';
import {Processor} from '../../../common/asset/interfaces/processor.interface';
import {UpdateProcessor} from '../../../core/update/processors/update.processor';

describe('UpdateCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let processor: Processor;
  beforeEach(() => processor = new UpdateProcessor());

  let setLoggerStub: sinon.SinonStub;
  let processStub: sinon.SinonStub;
  beforeEach(() => {
    setLoggerStub = sandbox.stub(LoggerService, 'setLogger');
    processStub = sandbox.stub(processor, 'processV2').callsFake(() => Promise.resolve());
  });

  let handler: CommandHandler;
  beforeEach(() => handler = new UpdateCommandHandler(processor));

  describe('#execute()', () => {
    const args: UpdateCommandArguments = {};
    const options: UpdateCommandOptions = {};

    it('should set the logger', () => {
      return handler.execute(args, options, console)
        .then(() => {
          sinon.assert.calledOnce(setLoggerStub);
        });
    });

    it('should run the update processor', () => {
      return handler.execute(args, options, console)
        .then(() => {
          sinon.assert.calledOnce(processStub);
        });
    });
  });
});
