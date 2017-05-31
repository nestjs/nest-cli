import {Generator} from '../../../common/interfaces/generator.interface';
import {ComponentGenerator} from '../../generators/component.generator';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {PassThrough} from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import {FileNameBuilder} from '../../builders/file-name.builder';
import {ClassNameBuilder} from '../../builders/class-name.builder';
import {LoggerService} from '../../loggers/logger.service';

describe('ComponentGenerator', () => {
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
  beforeEach(() => generator = new ComponentGenerator());

  describe('#generate()', () => {
    let createReadStreamStub: sinon.SinonStub;
    let createWriteStreamStub: sinon.SinonStub;
    let pipeStub: sinon.SinonStub;
    beforeEach(() => {
      createReadStreamStub = sandbox.stub(fs, 'createReadStream').callsFake(() => new PassThrough());
      createWriteStreamStub = sandbox.stub(fs, 'createWriteStream').callsFake(() => new PassThrough());
      pipeStub = sandbox.stub(PassThrough.prototype, 'pipe').callsFake(() => new PassThrough());
    });

    it('should build the asset class name', done => {
      const addNameSpy: sinon.SinonSpy = sandbox.spy(ClassNameBuilder.prototype, 'addName');
      const addAssetSpy: sinon.SinonSpy = sandbox.spy(ClassNameBuilder.prototype, 'addAsset');
      const buildSpy: sinon.SinonSpy = sandbox.spy(ClassNameBuilder.prototype, 'build');
      generator.generate('path/to/asset')
        .then(() => {
          expect(addNameSpy.calledTwice).to.be.true;
          expect(addAssetSpy.calledTwice).to.be.true;
          expect(buildSpy.calledTwice).to.be.true;
          done();
        })
        .catch(done);
    });

    it('should build the asset file name', done => {
      const addNameSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addName');
      const addAssetSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addAsset');
      const addTestSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addTest');
      const addExtensionSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addExtension');
      const buildSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'build');
      generator.generate('path/to/asset')
        .then(() => {
          expect(addNameSpy.calledThrice).to.be.true;
          expect(addAssetSpy.calledThrice).to.be.true;
          expect(addTestSpy.calledOnce);
          expect(addExtensionSpy.calledThrice).to.be.true;
          expect(buildSpy.calledThrice).to.be.true;
          done();
        })
        .catch(done);
    });

    it('should copy the test asset file', done => {
      generator.generate('path/to/asset')
        .then(() => {
          expect(createReadStreamStub.calledWith(
            path.resolve(__dirname, '../../../assets/ts/component/component.spec.ts.template')
          )).to.be.true;
          expect(createWriteStreamStub.calledWith(
            path.resolve(process.cwd(), 'path/to/asset', 'asset.service.spec.ts')
          )).to.be.true;
          expect(pipeStub.callCount).to.be.equal(6);
          done();
        })
        .catch(done);
    });

    it('should copy the test asset file', done => {
      generator.generate('path/to/asset')
        .then(() => {
          expect(createReadStreamStub.calledWith(
            path.resolve(__dirname, '../../../assets/ts/component/component.spec.ts.template')
          )).to.be.true;
          expect(createWriteStreamStub.calledWith(
            path.resolve(process.cwd(), 'path/to/asset', 'asset.service.spec.ts')
          )).to.be.true;
          expect(pipeStub.callCount).to.be.equal(6);
          done();
        })
        .catch(done);
    });

  });
});
