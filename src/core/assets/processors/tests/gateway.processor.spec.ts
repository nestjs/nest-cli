import {ModuleFinderImpl} from '../../module-finders/module.finder';
import {AssetGenerator} from '../../generators/asset.generator';
import {ModuleUpdaterImpl} from '../../module-updaters/module.updater';
import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {GatewayProcessor} from '../gateway.processor';
import {Asset} from '../../../../common/asset/interfaces/asset.interface';
import {AssetEnum} from '../../../../common/asset/enums/asset.enum';
import * as path from 'path';
import * as sinon from 'sinon';

describe('GatewayProcessor', () => {
  const assetName: string = 'name';
  const extension: string = 'ts';
  let moduleName: string;

  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let findStub: sinon.SinonStub;
  let generateStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;
  beforeEach(() => {
    findStub = sandbox.stub(ModuleFinderImpl.prototype, 'find');
    generateStub = sandbox.stub(AssetGenerator.prototype, 'generate').callsFake(() => Promise.resolve());
    updateStub = sandbox.stub(ModuleUpdaterImpl.prototype, 'update').callsFake(() => Promise.resolve());
  });

  describe('#process()', () => {
    context('generate gateway in app module', () => {
      let processor: Processor;
      beforeEach(() => {
        moduleName = 'app';
        findStub.callsFake(() => Promise.resolve('src/app/app.module.ts'));
        processor = new GatewayProcessor(assetName, moduleName, extension);
      });

      const assets: Asset[] = [
        {
          type: AssetEnum.GATEWAY,
          filename: path.join(
            process.cwd(),
            'src/app',
            'gateways',
            'name',
            'name.gateway.ts'
          ),
          className: 'NameGateway',
          template: {
            filename: path.resolve(__dirname, '../../../../assets/ts/gateway/gateway.ts.template'),
            replacer: {
              __CLASS_NAME__: 'NameGateway',
              __DIR_NAME__: `'./gateways/name/name.gateway'`
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

      it('should generate gateway assets', () => {
        return processor.process()
          .then(() => {
            sinon.assert.calledWith(generateStub, assets[0]);
          });
      });

      it('should update the module', () => {
        return processor.process()
          .then(() => {
            sinon.assert.calledOnce(updateStub);
            sinon.assert.calledWith(updateStub, path.join(process.cwd(), 'src/app/app.module.ts'), assets[0]);
          });
      });
    });
  });
});
