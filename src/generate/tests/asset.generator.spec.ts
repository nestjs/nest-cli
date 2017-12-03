import { expect } from 'chai';
import { Template, TemplateId, TemplateReplacer, Token } from '../template.replacer';
import * as sinon from 'sinon';
import { ConfigurationLoader } from '../../configuration/configuration.loader';
import { TokenName, TokensGenerator } from '../tokens.generator';
import { TemplateLoader } from '../template.loader';
import { AssetGenerator } from '../asset.generator';

describe('AssetGenerator', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let getPropertyStub: sinon.SinonStub;
  let generateStub: sinon.SinonStub;
  let loadStub: sinon.SinonStub;
  let replaceStub: sinon.SinonStub;
  beforeEach(() => {
    getPropertyStub = sandbox.stub(ConfigurationLoader, 'getProperty').callsFake(() => 'ts');
    generateStub = sandbox.stub(TokensGenerator.prototype, 'generate').callsFake(() => [
      {
        name: TokenName.CLASS_NAME,
        value: 'NameType'
      },
      {
        name: TokenName.SPEC_IMPORT,
        value: './name.type'
      }
    ]);
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
    replaceStub = sandbox.stub(TemplateReplacer.prototype, 'replace').callsFake((template) => {
      return {
        id: template.id,
        content: 'content'
      }
    });
  });

  let generator: AssetGenerator;
  beforeEach(() => generator = new AssetGenerator());
  describe('#generate()', () => {
    const name = 'name';
    const type = 'type';
    it('should get the project language configuration property', async () => {
      await generator.generate(type, name);
      sinon.assert.calledWith(getPropertyStub, 'language');
    });
    it('should generate tokens to replace in template', async () => {
      await generator.generate(type, name);
      sandbox.assert.calledWith(generateStub, 'type', 'name');
    });
    it('should load the right asset template', async () => {
      await generator.generate(type, name);
      sandbox.assert.calledWith(loadStub, 'type', 'ts');
    });
    it('should replace template tokens', async () => {
      const templates: Template[] = [
        {
          id: TemplateId.MAIN,
          content: 'content'
        },
        {
          id: TemplateId.SPEC,
          content: 'content'
        }
      ];
      const tokens: Token[] = [
        {
          name: TokenName.CLASS_NAME,
          value: 'NameType'
        },
        {
          name: TokenName.SPEC_IMPORT,
          value: './name.type'
        }
      ];
      await generator.generate(type, name);
      sandbox.assert.calledWith(replaceStub, templates[0], tokens);
      sandbox.assert.calledWith(replaceStub, templates[1], tokens);
    });
    it('should return an asset according to type and simple name', async () => {
      const name = 'name';
      const type = 'type';
      expect(await generator.generate(type, name)).to.be.deep.equal([
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
      ]);
    });
  });
});
