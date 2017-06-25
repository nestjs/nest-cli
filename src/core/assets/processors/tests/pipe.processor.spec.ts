import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {PipeProcessor} from '../pipe.processor';
import {AssetGenerator} from '../../generators/asset.generator';
import {ModuleFinderImpl} from '../../module-finders/module.finder';
import * as sinon from 'sinon';
import * as path from 'path';
import {AssetEnum} from '../../../../common/asset/enums/asset.enum';
import {Asset} from '../../../../common/asset/interfaces/asset.interface';

describe('PipeProcessor', () => {
  const assetName: string = 'name';
  const extension: string = 'ts';
  let moduleName: string;

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let findStub: sinon.SinonStub;
  let generateStub: sinon.SinonStub;
  beforeEach(() => {
    findStub = sandbox.stub(ModuleFinderImpl.prototype, 'find');
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
  });

  describe('#process()', () => {
    context('generate pipe in app module', () => {
      let processor: Processor;
      beforeEach(() => {
        moduleName = 'app';
        findStub.callsFake(() => Promise.resolve('src/app/app.module.ts'));
        processor = new PipeProcessor(assetName, moduleName, extension);
      });

      const assets: Asset[] = [
        {
          type: AssetEnum.PIPE,
          filename: path.join(
            process.cwd(),
            'src/app',
            'pipes',
            'name.pipe.ts'
          ),
          className: 'NamePipe',
          template: {
            filename: path.resolve(__dirname, '../../../../assets/ts/pipe/pipe.ts.template'),
            replacer: {
              __CLASS_NAME__: 'NamePipe',
              __DIR_NAME__: `'./pipes/name.pipe'`
            }
          }
        }
      ];

      it('should find the moduleName filename', () => {
        return processor.process()
          .then(() => {
            sinon.assert.calledOnce(findStub);
            sinon.assert.calledWith(findStub, moduleName);
          });
      });

      it('should generate component assets', () => {
        return processor.process()
          .then(() => {
            sinon.assert.calledWith(generateStub, assets[0]);
          });
      });
    });
  });
});
