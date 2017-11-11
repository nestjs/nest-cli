import * as sinon from 'sinon';
import { CommandHandler } from '../../../common/program/interfaces/command.handler.interface';
import { ConfigurationService } from '../../../core/configuration/configuration.service';
import { ServeCommandHandler } from '../serve-command.handler';


describe('ServeCommandHandler', () => {
    let sandbox: sinon.SinonSandbox;
    beforeEach(() => sandbox = sinon.sandbox.create());
    afterEach(() => sandbox.restore());

    let handler: CommandHandler;
    beforeEach(() => {
        handler = new ServeCommandHandler();
    });

    let loadStub: sinon.SinonStub;
    let getPropertyStub: sinon.SinonStub;
    beforeEach(() => {
        loadStub = sandbox.stub(ConfigurationService, 'load').callsFake(() => Promise.resolve());
        getPropertyStub = sandbox.stub(ConfigurationService, 'getProperty').callsFake(() => 'ts')
    });

    describe('#execute()', () => {
        it('should run the command handler', () => {
            return handler.execute({}, {}, console)
                .then(() => {
                    sinon.assert.calledOnce(loadStub);
                });
        });

    });
});
