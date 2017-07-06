import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import {UpdateCommandHandler} from '../update-command.handler';
import * as sinon from 'sinon';
import {LoggerService} from '../../../core/logger/logger.service';
import {UpdateCommandArguments} from '../../../common/program/interfaces/command.aguments.interface';
import {UpdateCommandOptions} from '../../../common/program/interfaces/command.options.interface';

describe('UpdateCommandHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let setLoggerStub: sinon.SinonStub;
  beforeEach(() => setLoggerStub = sandbox.stub(LoggerService, 'setLogger'));

  let handler: CommandHandler;
  beforeEach(() => handler = new UpdateCommandHandler());
  describe('#execute()', () => {
    const args: UpdateCommandArguments = {};
    const options: UpdateCommandOptions = {};
    it('should set the logger', () => {
      handler.execute(args, options, console)
        .then(() => {
          sinon.assert.calledOnce(setLoggerStub);
        });
    });
  });
});
