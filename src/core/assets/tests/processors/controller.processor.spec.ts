import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {AssetGenerator} from '../../generators/asset.generator';
import * as sinon from 'sinon';
import * as path from 'path';
import {Asset} from '../../../../common/asset/interfaces/asset.interface';
import {ControllerProcessor} from '../../processors/controller.processor';

describe('ControllerProcessor', () => {
  const name: string = 'name';

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let processor: Processor;
  beforeEach(() => processor = new ControllerProcessor(name));

  let generateStub: sinon.SinonStub;
  beforeEach(() => {
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
  });

  describe('#process()', () => {
    it('should generate component assets', () => {
      const assets: Asset[] = [
        {
          filename: path.join(process.cwd(), 'src/app/modules/', 'name/name.controller.ts'),
          className: 'NameController',
          template: {
            filename: path.resolve(__dirname, '../../../assets/ts/controller/controller.ts.template'),
            replacer: {
              __CLASS_NAME__: 'NameController'
            }
          }
        },
        {
          filename: path.join(process.cwd(), 'src/app/modules/', 'name/name.controller.spec.ts'),
          className: 'NameController',
          template: {
            filename: path.resolve(__dirname, '../../../assets/ts/controller/controller.spec.ts.template'),
            replacer: {
              __CLASS_NAME__: 'NameController',
              __IMPORT__: 'name.controller.ts'
            }
          }
        }
      ];
      return processor.process()
        .then(() => {
          sinon.assert.calledWith(generateStub, assets[0]);
          sinon.assert.calledWith(generateStub, assets[1]);
        });
    });
  });
});


