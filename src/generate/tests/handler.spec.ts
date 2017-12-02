import * as sinon from 'sinon';
import { ConfigurationLoader } from '../../configuration/configuration.loader';
import { TemplateLoader } from '../tamplate.loader';
import { GenerateHandler } from '../handler';
import { TokenName, TokensGenerator } from '../tokens.generator';
import { GenerateArguments } from '../command';
import { Template, TemplateId, TemplateReplacer, Token } from '../template.replacer';

describe('GenerateHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let getPropertyStub: sinon.SinonStub;
  let loadStub: sinon.SinonStub;
  let generateFromStub: sinon.SinonStub;
  let replaceStub: sinon.SinonStub;
  beforeEach(() => {
    getPropertyStub = sandbox.stub(ConfigurationLoader, 'getProperty').callsFake(() => 'ts');
    loadStub = sandbox.stub(TemplateLoader.prototype, 'load').callsFake(() => Promise.resolve([
      {
        id: TemplateId.MAIN,
        content: 'content'
      },
      {
        id: TemplateId.SPEC,
        content: 'content'
      }
    ]));
    generateFromStub = sandbox.stub(TokensGenerator.prototype, 'generateFrom').callsFake(() => [
      {
        name: TokenName.CLASS_NAME,
        value: 'NameType'
      }
    ]);
    replaceStub = sandbox.stub(TemplateReplacer.prototype, 'replace').callsFake(() => {
      return {
        id: TemplateId.MAIN,
        content: 'content'
      }
    });
  });

  let handler: GenerateHandler;
  beforeEach(() => handler = new GenerateHandler());
  describe('#handle()', () => {
    const args: GenerateArguments = {
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
    it('should generate tokens to replace in template', async () => {
      await handler.handle(args);
      sandbox.assert.calledWith(generateFromStub, 'type', 'name');
    });
    it('should replace template tokens', async () => {
      const templates: Template[] = [
        {
          id: TemplateId.MAIN,
          content: 'content'
        }
      ];
      const tokens: Token[] = [
        {
          name: TokenName.CLASS_NAME,
          value: 'NameType'
        }
      ];
      await handler.handle(args);
      sandbox.assert.calledWith(replaceStub, templates[0], tokens);
    });
  });
});
