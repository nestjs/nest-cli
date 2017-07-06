import {PackageJsonUpdater} from '../package-json.updater';

describe('PackageJsonUpdater', () => {
  it('can be created', () => {
    const updater: PackageJsonUpdater = new PackageJsonUpdater();
  });

  describe('#update()', () => {
    it('can be called', () => {
      const updater: PackageJsonUpdater = new PackageJsonUpdater();
      return updater.update();
    });
  });
});
