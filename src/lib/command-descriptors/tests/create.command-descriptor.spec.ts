import * as sinon from 'sinon';
import {Command} from '../../../common/program/interfaces/command.interface';
import {Program} from '../../../common/program/interfaces/program.interface';
import {CreateCommandDescriptor} from '../create.command-descriptor';
import {CreateCommandHandler} from '../../handlers/create-command.handler';
import {CaporalProgram} from '../../../core/program/caporal/caporal.program';
import {CommandDescriptor} from '../../../common/program/interfaces/command.descriptor.interface';
import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';

describe('CreateCommandDescriptor', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  let command: Command;
  beforeEach(() => {
    const program: Program = new CaporalProgram();
    command = program.command('name', 'description');
  });

  describe('#declare()', () => {
    let argumentStub: sinon.SinonStub;
    let optionStub: sinon.SinonStub;
    let handlerStub: sinon.SinonStub;
    beforeEach(() => {
      argumentStub = sandbox.stub(command, 'argument').callsFake(() => command);
      optionStub = sandbox.stub(command, 'option').callsFake(() => command);
      handlerStub = sandbox.stub(command, 'handler').callsFake(() => command);
    });

    let handler: CommandHandler;
    beforeEach(() => {
      handler = new CreateCommandHandler();
      const descriptor: CommandDescriptor = new CreateCommandDescriptor(handler);
      descriptor.describe(command);
    });

    it('should declare the mandatory name argument with the right description', () => {
      sinon.assert.calledWith(argumentStub, '<name>', 'Nest application name');
    });

    it('should declare the optional destination argument with the right description', () => {
      sinon.assert.calledWith(argumentStub, '[destination]', 'Where the Nest application will be created');
    });

    it('should declare the repository option with the right description', () => {
      sinon.assert.calledWith(optionStub, '-r, --repository <repository>', 'Github repository where the project template is');
    });

    it('should call handler() with the CreateCommandHandler', () => {
      sinon.assert.calledWith(handlerStub, handler);
    });
  });
});
