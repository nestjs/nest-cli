import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {AssetGenerator} from '../../generators/asset.generator';
import * as sinon from 'sinon';
import * as path from 'path';
import {Asset} from '../../../../common/asset/interfaces/asset.interface';
import {ComponentProcessor} from '../component.processor';
import {ModuleUpdaterImpl} from '../../module-updaters/module.updater';
import {AssetEnum} from '../../../../common/asset/enums/asset.enum';
import {ModuleFinderImpl} from '../../module-finders/module.finder';

describe('ComponentProcessor', () => {
  const name: string = 'name';
  const extension: string = 'ts';
  let moduleName: string;

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let findStub: sinon.SinonStub;
  let generateStub: sinon.SinonStub;
  let updateV1Stub: sinon.SinonStub;
  let updateV2Stub: sinon.SinonStub;
  beforeEach(() => {
    findStub = sandbox.stub(ModuleFinderImpl.prototype, 'find');
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
    updateV1Stub = sandbox.stub(ModuleUpdaterImpl.prototype, 'updateV1').callsFake(() => Promise.resolve());
    updateV2Stub = sandbox.stub(ModuleUpdaterImpl.prototype, 'updateV2').callsFake(() => Promise.resolve());
  });

  describe('#process()', () => {
    context('generate component in app module', () => {
      let processor: Processor;
      beforeEach(() => {
        moduleName = 'app';
        findStub.callsFake(() => Promise.resolve('src/app/app.module.ts'));
        processor = new ComponentProcessor(name, moduleName, extension);
      });

      const assets: Asset[] = [
        {
          type: AssetEnum.COMPONENT,
          filename: path.join(
            process.cwd(),
            'src/app',
            'services',
            'name.service.ts'
          ),
          className: 'NameService',
          template: {
            filename: path.resolve(__dirname, '../../../../assets/ts/component/component.ts.template'),
            replacer: {
              __CLASS_NAME__: 'NameService',
              __DIR_NAME__: `'./services/name.service.ts'`
            }
          }
        },
        {
          type: AssetEnum.COMPONENT,
          filename: path.join(
            process.cwd(),
            'src/app',
            'services',
            'name.service.spec.ts'
          ),
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
            sinon.assert.calledWith(generateStub, assets[1]);
          });
      });

      it('should update the nearest parent module', () => {
        return processor.process()
          .then(() => {
            sinon.assert.calledOnce(updateV2Stub);
            sinon.assert.calledWith(updateV2Stub, path.join(process.cwd(), 'src/app/app.module.ts'), assets[0]);
          });
      });
    });
  });
});

