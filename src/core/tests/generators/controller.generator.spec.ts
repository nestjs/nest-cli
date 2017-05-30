import {Generator} from '../../../common/interfaces/generator.interface';
import {ControllerGenerator} from '../../generators/controller.generator';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {PassThrough} from 'stream';
import * as fs from 'fs';
import * as path from 'path';

describe('ControllerGenerator', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let generator: Generator;
  beforeEach(() => generator = new ControllerGenerator());

  describe('#generate()', () => {
    let createReadStreamStub: sinon.SinonStub;
    let createWriteStreamStub: sinon.SinonStub;
    let pipeStub: sinon.SinonStub;
    beforeEach(() => {
      createReadStreamStub = sandbox.stub(fs, 'createReadStream').callsFake(() => new PassThrough());
      createWriteStreamStub = sandbox.stub(fs, 'createWriteStream').callsFake(() => new PassThrough());
      pipeStub = sandbox.stub(PassThrough.prototype, 'pipe');
    });

    it('should throw an error', () => {
      expect(() => {
        generator.generate('name');
      }).to.throw;
    });

    context('mange the controller asset generation', () => {
      it.skip('should create a read stream from the controller asset file', done => {
        generator.generate('path/to/asset')
          .then(() => {
            expect(createReadStreamStub.calledWith(
              path.resolve(__dirname, '../../../assets/ts/controller/controller.ts.template')
            )).to.be.true;
            done();
          })
          .catch(done);
      });

      it.skip('should create a write stream to the generated asset', done => {
        const name: string = 'path/to/asset';
        generator.generate(name)
          .then(() => {
            expect(createWriteStreamStub.calledWith(
              path.resolve(process.cwd(), name, '[name].controller.ts')
            )).to.be.true;
            done();
          })
          .catch(done);
      });

      it.skip('should pipe read stream to the write stream', done => {
        generator.generate('path/to/asset')
          .then(() => {
            expect(pipeStub.calledOnce).to.be.true;
            done();
          })
          .catch(done);
      });
    });

    context('managing the test controller asset generation', () => {
      it.skip('should create a read stream from the test controller asset file', done => {
        generator.generate('path/to/asset')
          .then(() => {
            expect(createReadStreamStub.calledWith(
              path.resolve(__dirname, '../../../assets/ts/controller/controller.spec.ts.template')
            )).to.be.true;
            done();
          })
          .catch(done);
      });

      it.skip('should create a write stream to the generated asset', done => {
        const name: string = 'path/to/asset';
        generator.generate(name)
          .then(() => {
            expect(createWriteStreamStub.calledWith(
              path.resolve(process.cwd(), name, '[name].controller.spec.ts')
            )).to.be.true;
            done();
          })
          .catch(done);
      });

      it.skip('should pipe read stream to the write stream', done => {
        generator.generate('path/to/asset')
          .then(() => {
            expect(pipeStub.calledOnce).to.be.true;
            done();
          })
          .catch(done);
      });
    });
  });
});
