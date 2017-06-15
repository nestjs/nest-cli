import {AssetGenerator, ComponentGenerator, ControllerGenerator, ModuleGenerator} from '../../generators';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {FileSystemUtils} from '../../../utils/file-system.utils';
import {AssetEnum} from '../../../../common/asset/enums/asset.enum';
import {Generator} from '../../../../common/asset/interfaces/generator.interface';

describe('AssetGenerator', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let generator: Generator;
  describe('#generate()', () => {
    let generateStub: sinon.SinonStub;
    let mkdirStub: sinon.SinonStub;
    beforeEach(() => {
      mkdirStub = sandbox.stub(FileSystemUtils, 'mkdir').callsFake(() => Promise.resolve());
    });

    it('should generate the asset folder structure', () => {
      generator = new AssetGenerator(AssetEnum.MODULE);
      generateStub = sandbox.stub(ModuleGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
      return generator.generate('path/to/asset')
        .then(() => {
          sinon.assert.calledWith(mkdirStub, 'path/to/asset');
        });
    });

    it('should use the ModuleGenerator.generate()', () => {
      generator = new AssetGenerator(AssetEnum.MODULE);
      generateStub = sandbox.stub(ModuleGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
      return generator.generate('name')
        .then(() => {
          expect(generateStub.calledOnce).to.be.true;
        });
    });

    it('should use the ControllerGenerator.generate()', () => {
      generator = new AssetGenerator(AssetEnum.CONTROLLER);
      generateStub = sandbox.stub(ControllerGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
      return generator.generate('name')
        .then(() => {
          expect(generateStub.calledOnce).to.be.true;
        });
    });

    it('should use the ComponentGenerator.generate()', () => {
      generator = new AssetGenerator(AssetEnum.COMPONENT);
      generateStub = sandbox.stub(ComponentGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
      return generator.generate('name')
        .then(() => {
          expect(generateStub.calledOnce).to.be.true;
        });
    });
  });
});
