import * as sinon from 'sinon';
import * as fs from 'fs';
import {ModuleUpdater} from '../../../common/interfaces/module.updater.interface';
import {ComponentUpdater} from '../../module-updaters/component.updater';
import {ModuleFinderImpl} from '../../module-finders/module.finder';

describe('ComponentUpdater', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let updater: ModuleUpdater;
  beforeEach(() => updater = new ComponentUpdater());

  let findFromStub: sinon.SinonStub;
  let createReadStreamStub: sinon.SinonStub;
  beforeEach(() => {
    findFromStub = sandbox.stub(ModuleFinderImpl.prototype, 'findFrom');
    createReadStreamStub = sandbox.stub(fs, 'createReadStream')
  });

  describe('#update()', () => {
    const filename: string = 'path/to/asset/asset.service.ts';
    const className: string = 'AssetService';
    const moduleFilename: string = 'path/to/asset.module.ts';

    beforeEach(() => findFromStub.callsFake(() => Promise.resolve(moduleFilename)));

    it('should use the module finder to retrieve the nearest module path', () => {
      return updater.update(filename, className)
        .then(() => {
          sinon.assert.calledWith(findFromStub, filename);
        });
    });

    it('should read the module filename', () => {
      return updater.update(filename, className)
        .then(name => {
          sinon.assert.calledWith(createReadStreamStub, moduleFilename);
        });
    });
  });
});
