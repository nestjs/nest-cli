import * as sinon from 'sinon';
import * as caporal from 'caporal';
import {Command} from '../../../../common/program/interfaces/command.interface';
import {CommandHandler} from '../../../../common/program/interfaces/command.handler.interface';
import {CaporalCommand} from '../caporal.command';

describe('CaporalCommand', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let staticCaporalCommand;
  beforeEach(() => staticCaporalCommand = caporal.command('name', 'description'));

  let command: Command;
  beforeEach(() => command = new CaporalCommand(staticCaporalCommand));

  describe('#alias()', () => {
    it('should call caporal.command.alias()', () => {
      const aliasStub: sinon.SinonStub = sandbox.stub(staticCaporalCommand, 'alias');
      command.alias('name');
      sinon.assert.calledWith(aliasStub, 'name');
    });
  });

  describe('#argument()', () => {
    it('should call caporal.command.argument()', () => {
      const argumentStub: sinon.SinonStub = sandbox.stub(staticCaporalCommand, 'argument');
      command.argument('name', 'description');
      sinon.assert.calledWith(argumentStub, 'name', 'description');
    });
  });

  describe('#option()', () => {
    it('should call caporal.command.option()', () => {
      const optionStub: sinon.SinonStub = sandbox.stub(staticCaporalCommand, 'option');
      command.option('name', 'description');
      sinon.assert.calledWith(optionStub, 'name', 'description');
    });
  });

  describe('#handler()', () => {
    class TestHandler implements CommandHandler {
      public execute(args: any, options: any, logger: any): Promise<void> {
        throw new Error("Method not implemented.");
      }
    }

    it.skip('should call caporal.command.action()', () => {
      const actionStub: sinon.SinonStub = sandbox.stub(staticCaporalCommand, 'action');
      const handler: CommandHandler = new TestHandler();
      command.handler(handler);
      sinon.assert.calledWith(actionStub, handler.execute.bind(handler));
    });
  });
});
