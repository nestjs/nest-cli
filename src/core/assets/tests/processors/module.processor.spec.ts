import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {ModuleProcessor} from '../../processors/module.processor';
import {AssetGenerator} from '../../generators/asset.generator';
import * as sinon from 'sinon';
import * as path from 'path';
import {Asset} from '../../../../common/asset/interfaces/asset.interface';

describe('ModuleProcessor', () => {
  const name: string = 'name';

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let processor: Processor;
  beforeEach(() => processor = new ModuleProcessor(name));

  let generateStub: sinon.SinonStub;
  beforeEach(() => {
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
  });

  describe('#process()', () => {
    it('should generate module assets', () => {
      const assets: Asset[] = [
        {
          filename: path.join(process.cwd(), 'src/app/modules/', 'name/name.module.ts'),
          className: 'NameModule',
          template: {
            filename: path.resolve(__dirname, '../../../../assets/ts/module/module.ts.template'),
            replacer: {
              __CLASS_NAME__: 'NameModule'
            }
          }
        }
      ];
      return processor.process()
        .then(() => {
          sinon.assert.calledWith(generateStub, assets[0]);
        });
    });
  });
});
