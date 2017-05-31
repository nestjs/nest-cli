import {ModuleGenerator} from '../../generators/module.generator';
import {Generator} from '../../../common/interfaces/generator.interface';
import * as sinon from 'sinon';
import * as fs from 'fs';
import {expect} from 'chai';
import * as path from 'path';
import {PassThrough} from 'stream';
import {ReplaceTransform} from '../../streams/replace.transform';
import {ClassNameBuilder} from '../../builders/class-name.builder';
import {FileNameBuilder} from '../../builders/file-name.builder';

describe('ModuleGenerator', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

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

    context('name generations', () => {
      it('should build the asset class name', done => {
        const addNameSpy: sinon.SinonSpy = sandbox.spy(ClassNameBuilder.prototype, 'addName');
        const addAssetSpy: sinon.SinonSpy = sandbox.spy(ClassNameBuilder.prototype, 'addAsset');
        const buildSpy: sinon.SinonSpy = sandbox.spy(ClassNameBuilder.prototype, 'build');
        generator.generate('path/to/asset')
          .then(() => {
            expect(addNameSpy.calledOnce).to.be.true;
            expect(addAssetSpy.calledOnce).to.be.true;
            expect(buildSpy.calledOnce).to.be.true;
            done();
          })
          .catch(done)
      });

      it('should build the asset file name', done =>{
        const addNameSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addName');
        const addAssetSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addAsset');
        const addExtensionSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addExtension');
        const buildSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'build');
        generator.generate('path/to/asset')
          .then(() => {
            expect(addNameSpy.calledOnce).to.be.true;
            expect(addAssetSpy.calledOnce).to.be.true;
            expect(addExtensionSpy.calledOnce).to.be.true;
            expect(buildSpy.calledOnce).to.be.true;
            done();
          })
          .catch(done)
      });
    });

    context('file copy', () => {
      it('should create a read stream from the module asset file', done => {
        generator.generate('path/to/asset')
          .then(() => {
            expect(createReadStreamStub.calledWith(
              path.resolve(__dirname, '../../../assets/ts/module/module.ts.template')
            )).to.be.true;
            done();
          })
          .catch(done);
      });

      it('should create a write stream to the generated asset', done => {
        const name: string = 'path/to/asset';
        generator.generate(name)
          .then(() => {
            expect(createWriteStreamStub.calledWith(
              path.resolve(process.cwd(), name, 'asset.module.ts')
            )).to.be.true;
            done();
          })
          .catch(done);
      });

      it('should pipe transform stream to the write stream', done => {
        generator.generate('path/to/asset')
          .then(() => {
            expect(pipeStub.calledTwice).to.be.true;
            done();
          })
          .catch(done);
      });
    });
  });
});
