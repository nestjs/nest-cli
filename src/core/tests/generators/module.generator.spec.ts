import {ModuleGenerator} from '../../generators/module.generator';
import {Generator} from '../../../common/interfaces/generator.interface';
import * as sinon from 'sinon';
import * as fs from 'fs';
import {expect} from 'chai';
import * as path from 'path';

describe('ModuleGenerator', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let generator: Generator;
  beforeEach(() => generator = new ModuleGenerator());

  describe('#generate()', () => {
    let createReadStreamStub: sinon.SinonStub;
    let createWriteStreamStub: sinon.SinonStub;
    beforeEach(() => {
      createReadStreamStub = sandbox.stub(fs, 'createReadStream').callsFake(() => {});
      createWriteStreamStub = sandbox.stub(fs, 'createWriteStream').callsFake(() => {});
    });

    it('should create a read stream from the module asset file', done => {
      generator.generate('path/to/asset')
        .then(() => {
          expect(createReadStreamStub.calledWith(path.resolve(__dirname, '../../../assets/ts/module/module.ts.template'))).to.be.true;
          done();
        })
        .catch(done);
    });

    it('should create a write stream to the generated asset', done => {
      generator.generate('path/to/asset')
        .then(() => {
          expect(createWriteStreamStub.calledOnce).to.be.true;
          done();
        })
        .catch(done);
    });
  });
});
