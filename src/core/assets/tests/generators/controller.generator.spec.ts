import {ControllerGenerator} from '../../generators/controller.generator';
import * as sinon from 'sinon';
import {PassThrough} from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import {ClassNameBuilder, FileNameBuilder} from '../../builders';
import {LoggerService} from '../../../logger';
import {ControllerUpdater} from '../../module-updaters/controller.updater';
import {Generator} from '../../../../common/asset/interfaces/generator.interface';

describe('ControllerGenerator', () => {
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

  let updateStub: sinon.SinonStub;
  beforeEach(() => {
    updateStub = sandbox.stub(ControllerUpdater.prototype, 'update').callsFake(() => Promise.resolve());
  });

  let generator: Generator;
  beforeEach(() => generator = new ControllerGenerator());

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
          sinon.assert.calledTwice(addNameSpy);
          sinon.assert.calledTwice(addAssetSpy);
          sinon.assert.calledTwice(buildSpy);
        });
    });

    it('should build the asset file name', () => {
      const addNameSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addName');
      const addAssetSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addAsset');
      const addTestSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addTest');
      const addExtensionSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'addExtension');
      const buildSpy: sinon.SinonSpy = sandbox.spy(FileNameBuilder.prototype, 'build');
      return generator.generateFrom('path/to/asset')
        .then(() => {
          sinon.assert.calledThrice(addNameSpy);
          sinon.assert.calledThrice(addAssetSpy);
          sinon.assert.calledOnce(addTestSpy);
          sinon.assert.calledThrice(addExtensionSpy);
          sinon.assert.calledThrice(buildSpy);
        });
    });

    it('should copy the asset', () => {
      return generator.generateFrom('path/to/asset')
        .then(() => {
          sinon.assert.calledWith(createReadStreamStub, path.resolve(__dirname, '../../../../assets/ts/controller/controller.ts.template'))
          sinon.assert.calledWith(createWriteStreamStub, path.resolve(process.cwd(), 'path/to/asset', 'asset.controller.ts'));
          sinon.assert.callCount(pipeStub, 4);
        });
    });

    it('should copy the test asset files', () => {
      return generator.generateFrom('path/to/asset')
        .then(() => {
          sinon.assert.calledWith(createReadStreamStub, path.resolve(__dirname, '../../../../assets/ts/controller/controller.spec.ts.template'));
          sinon.assert.calledWith(createWriteStreamStub, path.resolve(process.cwd(), 'path/to/asset', 'asset.controller.spec.ts'));
          sinon.assert.callCount(pipeStub, 4);
        });
    });

    it('should update the nearest module metadata and imports', () => {
      const name: string = 'path/to/asset';
      sandbox.stub(process, 'cwd').callsFake(() => '');
      return generator.generateFrom(name)
        .then(() => {
          sinon.assert.calledWith(updateStub, `${ name }/asset.controller.ts`);
        });
    });
  });
});
