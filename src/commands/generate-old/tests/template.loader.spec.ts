import * as sinon from 'sinon';
import { expect } from 'chai';
import { TemplateLoader } from '../template.loader';
import * as path from 'path';
import { FileSystemUtils } from '../../../utils/file-system.utils';

describe('TemplateLoader', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let readdirStub: sinon.SinonStub;
  let readFileStub: sinon.SinonStub;
  beforeEach(() => {
    readdirStub = sandbox.stub(FileSystemUtils, 'readdir')
      .callsFake(() => Promise.resolve([
        'type.ts.template',
        'type.spec.ts.template',
        'type.js.template',
        'type.spec.js.template'
      ]));
    readFileStub = sandbox.stub(FileSystemUtils, 'readFile')
      .callsFake(() => Promise.resolve('content'));
  });

  let loader: TemplateLoader;
  beforeEach(() => loader = new TemplateLoader());
  describe('#load()', () => {
    it('should read the asset type template dir to get asset type fileNames', async () => {
      await loader.load('type', 'ts');
      sinon.assert.calledWith(readdirStub, path.resolve(__dirname, '../templates/type'));
    });
    it('should load the language file content', async () => {
      await loader.load('type', 'ts');
      sinon.assert.calledWith(readFileStub, path.resolve(__dirname, '../templates/type/type.ts.template'));
      sinon.assert.calledWith(readFileStub, path.resolve(__dirname, '../templates/type/type.spec.ts.template'));
    });
    it('should return asset type associated templates', async () => {
      const contents: any = await loader.load('template', 'ts');
      expect(contents).to.be.deep.equal([
        {
          name: 'type.ts.template',
          content: 'content'
        },
        {
          name: 'type.spec.ts.template',
          content: 'content'
        }
      ]);
    });
  });
});
