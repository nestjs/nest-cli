import {Processor} from '../../../../common/asset/interfaces/processor.interface';
import {ModuleProcessor} from '../module.processor';
import {AssetGenerator} from '../../generators/asset.generator';
import * as sinon from 'sinon';
import * as path from 'path';
import {Asset} from '../../../../common/asset/interfaces/asset.interface';
import {ModuleFinder} from '../../../../common/asset/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../../module-finders/module.finder';

describe('ModuleProcessor', () => {
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
    let processor: Processor;

    context('generate module in app modules', () => {
      beforeEach(() => {
        moduleName = 'app';
        findStub.callsFake(() => Promise.resolve('src/app/app.module.ts'));
        processor = new ModuleProcessor(assetName, moduleName, extension)
      });

      it('should find the moduleName filename', () => {
        return processor.process()
          .then(() => {
            sinon.assert.calledOnce(findStub);
            sinon.assert.calledWith(findStub, moduleName);
          });
      });

      it('should generate module assets', () => {
        const assets: Asset[] = [
          {
            filename: path.join(process.cwd(), 'src/app', 'modules', 'name/name.module.ts'),
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
            sinon.assert.calledOnce(generateStub);
            sinon.assert.calledWith(generateStub, assets[0]);
          });
      });
    });

    context('generate module in sub app module', () => {
      beforeEach(() => {
        moduleName = 'moduleName';
        findStub.callsFake(() => Promise.resolve(`src/app/modules/${ moduleName }/${ moduleName }.module.ts`));
        processor = new ModuleProcessor(assetName, moduleName, extension)
      });

      it('should find the moduleName filename', () => {
        return processor.process()
          .then(() => {
            sinon.assert.calledOnce(findStub);
            sinon.assert.calledWith(findStub, moduleName);
          });
      });

      it('should generate module assets', () => {
        const assets: Asset[] = [
          {
            filename: path.join(
              process.cwd(),
              'src/app',
              'modules',
              'moduleName/modules',
              'name/name.module.ts'
            ),
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
});
