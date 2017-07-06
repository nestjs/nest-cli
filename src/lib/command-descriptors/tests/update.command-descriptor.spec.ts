import {UpdateCommandDescriptor} from '../update.command-descriptor';
import {Command} from '../../../common/program/interfaces/command.interface';
import {CaporalProgram} from '../../../core/program/caporal/caporal.program';
import {Program} from '../../../common/program/interfaces/program.interface';
import {UpdateCommandHandler} from '../../handlers/update-command.handler';
import * as sinon from 'sinon';

describe('UpdateCommandDescriptor', () => {
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
    let handlerStub: sinon.SinonStub;
    beforeEach(() => {
      handlerStub = sandbox.stub(command, 'handler').callsFake(() => command);
    });

    beforeEach(() => {
      UpdateCommandDescriptor.declare(command);
    });

    it('should call handler() with the CreateCommandHandler', () => {
      sinon.assert.calledWith(handlerStub, new UpdateCommandHandler());
    });
  });
});
