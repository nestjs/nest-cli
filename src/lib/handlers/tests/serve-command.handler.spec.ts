import * as sinon from 'sinon';
import { CommandHandler } from '../../../common/program/interfaces/command.handler.interface';
import { ConfigurationLoader } from '../../../configuration/configuration.loader';
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
        loadStub = sandbox.stub(ConfigurationLoader, 'load').callsFake(() => Promise.resolve());
        getPropertyStub = sandbox.stub(ConfigurationLoader, 'getProperty').callsFake(() => 'ts')
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
