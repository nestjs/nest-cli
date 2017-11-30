import * as sinon from 'sinon';
import { ConfigurationLoader } from '../../configuration/configuration.loader';
import { TemplateLoader } from '../tamplate.loader';
import { GenerateHandler } from '../handler';

describe('GenerateHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let getPropertyStub: sinon.SinonStub;
  let loadStub: sinon.SinonStub;
  beforeEach(() => {
    getPropertyStub = sandbox.stub(ConfigurationLoader, 'getProperty').callsFake(() => 'ts');
    loadStub = sandbox.stub(TemplateLoader.prototype, 'load').callsFake(() => Promise.resolve({
      main: 'content',
      spec: 'content'
    }));
  });

  let handler: GenerateHandler;
  beforeEach(() => handler = new GenerateHandler());
  describe('#handle()', () => {
    const args = {
      type: 'type',
      name: 'name'
    };
    it('should get the project language configuration property', async () => {
      await handler.handle(args);
      sinon.assert.calledWith(getPropertyStub, 'language');
    });
    it('should load the right asset template', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(loadStub, 'type', 'ts');
    });
  });
});
