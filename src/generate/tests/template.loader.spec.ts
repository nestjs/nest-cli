import * as sinon from 'sinon';
import { expect } from 'chai';
import { TemplateLoader } from '../tamplate.loader';
import { FileSystemUtils } from '../../utils/file-system.utils';
import * as path from 'path';

describe('TemplateLoader', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let readdirStub: sinon.SinonStub;
  let readFileStub: sinon.SinonStub;
  beforeEach(() => {
    readdirStub = sandbox.stub(FileSystemUtils, 'readdir')
      .callsFake(() => Promise.resolve([
        'filename.language.template',
        'filename.spec.language.template'
      ]));
    readFileStub = sandbox.stub(FileSystemUtils, 'readFile')
      .callsFake(() => Promise.resolve('content'));
  });

  let loader: TemplateLoader;
  beforeEach(() => loader = new TemplateLoader());
  describe('#load()', () => {
    it('should read the asset type template dir to get asset type fileNames', async () => {
      await loader.load('template', 'language');
      sinon.assert.calledWith(readdirStub, path.resolve(__dirname, '../templates/template'));
    });
    it('should load the language file content', async () => {
      await loader.load('template', 'language');
      sinon.assert.calledWith(readFileStub, path.resolve(__dirname, '../templates/template/filename.language.template'));
      sinon.assert.calledWith(readFileStub, path.resolve(__dirname, '../templates/template/filename.spec.language.template'));
    });
    it('should file contents', async () => {
      const contents: any = await loader.load('template', 'language');
      expect(contents).to.be.deep.equal({
        main: 'content',
        spec: 'content'
      });
    });
  });
});
