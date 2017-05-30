import {Generator} from '../../../common/interfaces/generator.interface';
import {ComponentGenerator} from '../../generators/component.generator';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {PassThrough} from 'stream';
import * as fs from 'fs';
import * as path from 'path';

describe('ComponentGenerator', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let generator: Generator;
  beforeEach(() => generator = new ComponentGenerator());

  describe('#generate()', () => {
    let createReadStreamStub: sinon.SinonStub;
    let createWriteStreamStub: sinon.SinonStub;
    let pipeStub: sinon.SinonStub;
    beforeEach(() => {
      createReadStreamStub = sandbox.stub(fs, 'createReadStream').callsFake(() => new PassThrough());
      createWriteStreamStub = sandbox.stub(fs, 'createWriteStream').callsFake(() => new PassThrough());
      pipeStub = sandbox.stub(PassThrough.prototype, 'pipe');
    });

    context('mange the controller asset generation', () => {
      it('should create a read stream from the component asset file', done => {
        generator.generate('path/to/asset')
          .then(() => {
            expect(createReadStreamStub.calledWith(
              path.resolve(__dirname, '../../../assets/ts/component/component.ts.template')
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
              path.resolve(process.cwd(), name, '[name].service.ts')
            )).to.be.true;
            done();
          })
          .catch(done);
      });

      it('should pipe read stream to the write stream', done => {
        generator.generate('path/to/asset')
          .then(() => {
            expect(pipeStub.calledTwice).to.be.true;
            done();
          })
          .catch(done);
      });
    });

    context('managing the test controller asset generation', () => {
      it('should create a read stream from the test component asset file', done => {
        generator.generate('path/to/asset')
          .then(() => {
            expect(createReadStreamStub.calledWith(
              path.resolve(__dirname, '../../../assets/ts/component/component.spec.ts.template')
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
              path.resolve(process.cwd(), name, '[name].service.spec.ts')
            )).to.be.true;
            done();
          })
          .catch(done);
      });

      it('should pipe read stream to the write stream', done => {
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
