import {ModuleGenerator} from '../../generators';
import {Generator} from '../../../common/interfaces';
import * as sinon from 'sinon';
import * as fs from 'fs';
import {expect} from 'chai';
import * as path from 'path';
import {PassThrough} from 'stream';
import {ClassNameBuilder, FileNameBuilder} from '../../builders';
import {LoggerService} from '../../loggers';

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

  describe('#generate()', () => {
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
      return generator.generate('path/to/asset')
        .then(() => {
          expect(addNameSpy.calledOnce).to.be.true;
          expect(addAssetSpy.calledOnce).to.be.true;
          expect(buildSpy.calledOnce).to.be.true;
        })
    });

    it('should build the asset file name', () => {
      const addNameSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addName');
      const addAssetSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addAsset');
      const addExtensionSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addExtension');
      const buildSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'build');
      return generator.generate('path/to/asset')
        .then(() => {
          expect(addNameSpy.calledOnce).to.be.true;
          expect(addAssetSpy.calledOnce).to.be.true;
          expect(addExtensionSpy.calledOnce).to.be.true;
          expect(buildSpy.calledOnce).to.be.true;
        })
    });

    it('should copy the asset file', () => {
      return generator.generate('path/to/asset')
        .then(() => {
          expect(createReadStreamStub.calledWith(
            path.resolve(__dirname, '../../../assets/ts/module/module.ts.template')
          )).to.be.true;
          expect(createWriteStreamStub.calledWith(
            path.resolve(process.cwd(), 'path/to/asset', 'asset.module.ts')
          )).to.be.true;
          expect(pipeStub.callCount).to.be.equal(2);
        });
    });
  });
});
