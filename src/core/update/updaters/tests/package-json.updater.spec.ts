import {PackageJsonUpdater} from '../package-json.updater';
import * as sinon from 'sinon';
import {NpmUtils} from '../../../utils/npm.utils';

describe('PackageJsonUpdater', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let updateStub: sinon.SinonStub;
  beforeEach(() => {
    updateStub = sandbox.stub(NpmUtils, 'update').callsFake(() => Promise.resolve());
  });

  let updater: PackageJsonUpdater;
  beforeEach(() => updater = new PackageJsonUpdater());

  describe('#update()', () => {
    it('should update via npm', () => {
      return updater.update()
        .then(() => {
          sinon.assert.calledOnce(updateStub);
        });
    });
  });
});
