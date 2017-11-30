import * as sinon from 'sinon';
import { ConfigurationLoader } from '../../configuration/configuration.loader';
import { TemplateLoader } from '../tamplate.loader';

export class GenerateHandler {
  constructor(private templateLoader: TemplateLoader = new TemplateLoader()) {}

  public async handle(args: any) {
    const language: string = ConfigurationLoader.getProperty('language');
    const templates: any = this.templateLoader.load(args.type, language);
  }
}

describe('GenerateHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let getPropertyStub: sinon.SinonStub;
  let loadStub: sinon.SinonStub;
  beforeEach(() => {
    getPropertyStub = sandbox.stub(ConfigurationLoader, 'getProperty').callsFake(() => 'ts');
    loadStub = sandbox.stub(TemplateLoader.prototype, 'load').callsFake(() => Promise.resolve());
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
