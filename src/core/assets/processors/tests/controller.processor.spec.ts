import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {AssetGenerator} from '../../generators/asset.generator';
import * as sinon from 'sinon';
import * as path from 'path';
import {Asset} from '../../../../common/asset/interfaces/asset.interface';
import {ControllerProcessor} from '../controller.processor';
import {ModuleUpdaterImpl} from '../../module-updaters/module.updater';

describe('ControllerProcessor', () => {
  const name: string = 'name';
  const extension: string= 'ts';

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let processor: Processor;
  beforeEach(() => processor = new ControllerProcessor(name, extension));

  let generateStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;
  beforeEach(() => {
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
    updateStub = sandbox.stub(ModuleUpdaterImpl.prototype, 'update').callsFake(() => Promise.resolve());
  });

  describe('#process()', () => {
    const assets: Asset[] = [
      {
        filename: path.join(
          process.cwd(),
          'src/app/modules/',
          'name/name.controller.ts'
        ),
        className: 'NameController',
        template: {
          filename: path.resolve(__dirname, '../../../../assets/ts/controller/controller.ts.template'),
          replacer: {
            __CLASS_NAME__: 'NameController'
          }
        }
      },
      {
        filename: path.join(
          process.cwd(),
          'src/app/modules/',
          'name/name.controller.spec.ts'
        ),
        className: 'NameController',
        template: {
          filename: path.resolve(__dirname, '../../../../assets/ts/controller/controller.spec.ts.template'),
          replacer: {
            __CLASS_NAME__: 'NameController',
            __IMPORT__: 'name.controller.ts'
          }
        }
      }
    ];

    it('should generate component assets', () => {
      return processor.process()
        .then(() => {
          sinon.assert.calledWith(generateStub, assets[0]);
          sinon.assert.calledWith(generateStub, assets[1]);
        });
    });

    it('should update the nearest parent module', () => {
      return processor.process()
        .then(() => {
          sinon.assert.calledWith(updateStub, assets[0].filename, assets[0].className);
        });
    });
  });
});


