import * as sinon from 'sinon';
import { CommandDescriptor } from '../../../common/program/interfaces/command.descriptor.interface';
import { CommandHandler } from '../../../common/program/interfaces/command.handler.interface';
import { Command } from '../../../common/program/interfaces/command.interface';
import { Program } from '../../../common/program/interfaces/program.interface';
import { CaporalProgram } from '../../../core/program/caporal/caporal.program';
import { InfoCommandHandler } from '../../handlers/info-command.handler';
import { InfoCommandDescriptor } from '../info.command-descriptor';


describe('InfoCommandDescriptor', () => {
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

        let handler: InfoCommandHandler;
        beforeEach(() => {
            handler = new InfoCommandHandler();
            const descriptor: CommandDescriptor = new InfoCommandDescriptor(handler);
            descriptor.describe(command);
        });

        it('should call handler() with the ServeCommandHandler', () => {
            sinon.assert.calledWith(handlerStub, handler);
        });
    });
});
