import * as sinon from 'sinon';
import { ConfigurationLoader } from '../../configuration/configuration.loader';
import { TemplateLoader } from '../tamplate.loader';
import { GenerateHandler } from '../handler';
import { TokenName, TokensGenerator } from '../tokens.generator';
import { GenerateArguments } from '../command';
import { Template, TemplateId, TemplateReplacer, Token } from '../template.replacer';
import { AssetGenerator } from '../asset.generator';

describe('GenerateHandler', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let generateStub: sinon.SinonStub;
  beforeEach(() => {
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve([
      {
        path: 'name.type.ts',
        template: {
          id: TemplateId.MAIN,
          content: 'content'
        }
      },
      {
        path: 'name.type.spec.ts',
        template: {
          id: TemplateId.SPEC,
          content: 'content'
        }
      }
    ]));
  });

  let handler: GenerateHandler;
  beforeEach(() => handler = new GenerateHandler());
  describe('#handle()', () => {
    const args: GenerateArguments = {
      type: 'type',
      name: 'name'
    };
    it('should generate assets according to input args', async () => {
      await handler.handle(args);
      sinon.assert.calledWith(generateStub, args.type, args.name);
    });
  });
});
