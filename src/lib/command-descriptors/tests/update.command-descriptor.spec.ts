import {UpdateCommandDescriptor} from '../update.command-descriptor';
import {CommandDescriptor} from '../../../common/program/interfaces/command.descriptor.interface';
import * as sinon from 'sinon';
import {Command} from '../../../common/program/interfaces/command.interface';
import {Program} from '../../../common/program/interfaces/program.interface';
import {CaporalProgram} from '../../../core/program/caporal/caporal.program';
import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';
import {UpdateCommandHandler} from '../../handlers/update-command.handler';

describe('UpdateCommandDescriptor', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let command: Command;
  let handler: CommandHandler;
  beforeEach(() => {
    const program: Program = new CaporalProgram();
    command = program.command('name', 'description');
    handler = new UpdateCommandHandler();
  });

  let handlerStub: sinon.SinonStub;
  beforeEach(() => handlerStub = sandbox.stub(command, 'handler').callsFake(() => command));

  let descriptor: CommandDescriptor;
  beforeEach(() => descriptor = new UpdateCommandDescriptor());

  describe('#describe()', () => {
    it('should set the update command handler as command handler', () => {
      descriptor.describe(command);
      sinon.assert.calledWith(handlerStub, handler);
    });
  });
});
