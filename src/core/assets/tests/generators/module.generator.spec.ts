import {ModuleGenerator} from '../../generators';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import {PassThrough} from 'stream';
import {ClassNameBuilder, FileNameBuilder} from '../../builders';
import {LoggerService} from '../../../logger';
import {Generator} from '../../../../common/asset/interfaces/generator.interface';

describe('ModuleGenerator', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  beforeEach(() => {
    sandbox.stub(LoggerService, 'getLogger').callsFake(() => {
      return {
        info: () => {}
      }
    });
  });

  let generator: Generator;
  beforeEach(() => generator = new ModuleGenerator());

  describe('#generateFrom()', () => {
    let createReadStreamStub: sinon.SinonStub;
    let createWriteStreamStub: sinon.SinonStub;
    let pipeStub: sinon.SinonStub;
    beforeEach(() => {
      createReadStreamStub = sandbox.stub(fs, 'createReadStream').callsFake(() => new PassThrough());
      createWriteStreamStub = sandbox.stub(fs, 'createWriteStream').callsFake(() => new PassThrough());
      pipeStub = sandbox.stub(PassThrough.prototype, 'pipe').callsFake(() => new PassThrough());
    });

    it('should build the asset class name', () => {
      const addNameSpy: sinon.SinonSpy = sandbox.spy(ClassNameBuilder.prototype, 'addName');
      const addAssetSpy: sinon.SinonSpy = sandbox.spy(ClassNameBuilder.prototype, 'addAsset');
      const buildSpy: sinon.SinonSpy = sandbox.spy(ClassNameBuilder.prototype, 'build');
      return generator.generateFrom('path/to/asset')
        .then(() => {
          sinon.assert.calledOnce(addNameSpy);
          sinon.assert.calledOnce(addAssetSpy);
          sinon.assert.calledOnce(buildSpy);
        })
    });

    it('should build the asset file name', () => {
      const addNameSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addName');
      const addAssetSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addAsset');
      const addExtensionSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addExtension');
      const buildSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'build');
      return generator.generateFrom('path/to/asset')
        .then(() => {
          sinon.assert.calledOnce(addNameSpy);
          sinon.assert.calledOnce(addAssetSpy);
          sinon.assert.calledOnce(addExtensionSpy);
          sinon.assert.calledOnce(buildSpy);
        })
    });

    it('should copy the asset file', () => {
      return generator.generateFrom('path/to/asset')
        .then(() => {
          sinon.assert.calledWith(createReadStreamStub, path.resolve(__dirname, '../../../../assets/ts/module/module.ts.template'));
          sinon.assert.calledWith(createWriteStreamStub, path.resolve(process.cwd(), 'path/to/asset', 'asset.module.ts'));
          sinon.assert.callCount(pipeStub, 2);
        });
    });
  });
});
