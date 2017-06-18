import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {AssetGenerator} from '../../generators/asset.generator';
import * as sinon from 'sinon';
import * as path from 'path';
import {Asset} from '../../../../common/asset/interfaces/asset.interface';
import {ComponentProcessor} from '../../processors/component.processor';

describe('ComponentProcessor', () => {
  const name: string = 'name';

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let processor: Processor;
  beforeEach(() => processor = new ComponentProcessor(name));

  let generateStub: sinon.SinonStub;
  beforeEach(() => {
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
  });

  describe('#process()', () => {
    it('should generate component assets', () => {
      const assets: Asset[] = [
        {
          filename: path.join(process.cwd(), 'src/app/modules/', 'name/name.service.ts'),
          className: 'NameService',
          template: {
            filename: path.resolve(__dirname, '../../../assets/ts/component/component.ts.template'),
            replacer: {
              __CLASS_NAME__: 'NameService'
            }
          }
        },
        {
          filename: path.join(process.cwd(), 'src/app/modules/', 'name/name.service.spec.ts'),
          className: 'NameService',
          template: {
            filename: path.resolve(__dirname, '../../../assets/ts/component/component.spec.ts.template'),
            replacer: {
              __CLASS_NAME__: 'NameService',
              __IMPORT__: 'name.service.ts'
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

