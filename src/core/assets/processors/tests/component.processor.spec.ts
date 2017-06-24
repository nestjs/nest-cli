import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {AssetGenerator} from '../../generators/asset.generator';
import * as sinon from 'sinon';
import * as path from 'path';
import {Asset} from '../../../../common/asset/interfaces/asset.interface';
import {ComponentProcessor} from '../component.processor';
import {ModuleUpdaterImpl} from '../../module-updaters/module.updater';
import {AssetEnum} from '../../../../common/asset/enums/asset.enum';

describe('ComponentProcessor', () => {
  const name: string = 'name';
  const extension: string = 'ts';

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let processor: Processor;
  beforeEach(() => processor = new ComponentProcessor(name, extension));

  let generateStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;
  beforeEach(() => {
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
    updateStub = sandbox.stub(ModuleUpdaterImpl.prototype, 'updateV1').callsFake(() => Promise.resolve());
  });

  describe('#process()', () => {
    const assets: Asset[] = [
      {
        type: AssetEnum.COMPONENT,
        filename: path.join(process.cwd(), 'src/app/modules/', 'name/name.service.ts'),
        className: 'NameService',
        template: {
          filename: path.resolve(__dirname, '../../../../assets/ts/component/component.ts.template'),
          replacer: {
            __CLASS_NAME__: 'NameService'
          }
        }
      },
      {
        type: AssetEnum.COMPONENT,
        filename: path.join(process.cwd(), 'src/app/modules/', 'name/name.service.spec.ts'),
        className: 'NameService',
        template: {
          filename: path.resolve(__dirname, '../../../../assets/ts/component/component.spec.ts.template'),
          replacer: {
            __CLASS_NAME__: 'NameService',
            __IMPORT__: 'name.service.ts'
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

