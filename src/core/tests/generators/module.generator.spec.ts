import {ModuleGenerator} from '../../generators/module.generator';
import {Generator} from '../../../common/interfaces/generator.interface';
import * as sinon from 'sinon';
import * as fs from 'fs';
import {expect} from 'chai';
import * as path from 'path';
import {PassThrough} from 'stream';
import {ReplaceTransform} from '../../streams/replace.transform';

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
      pipeStub = sandbox.stub(PassThrough.prototype, 'pipe');
    });

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
            path.resolve(process.cwd(), name, '[name].module.ts')
          )).to.be.true;
          done();
        })
        .catch(done);
    });

    it.skip('should pipe read stream to the transform stream', done => {
      generator.generate('path/to/asset')
        .then(() => {
          expect(pipeStub.calledWith(new ReplaceTransform('[NAME]', 'AssetModule'))).to.be.true;
          done();
        })
        .catch(done);
    });

    it.skip('should pipe transform stream to the write stream', done => {
      generator.generate('path/to/asset')
        .then(() => {
          expect(pipeStub.calledWith(new PassThrough())).to.be.true;
          done();
        })
        .catch(done);
    });
  });
});
