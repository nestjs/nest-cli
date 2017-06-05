import {ModuleUpdater} from '../../../common/interfaces/module.updater.interface';
import {ComponentUpdater} from '../../module-updaters/component.updater';

describe('ComponentUpdater', () => {
  it('can be created', () => {
    const updater: ModuleUpdater = new ComponentUpdater();
  });

  describe('#update()', () => {
    // TODO: need to have a module file finder
  });
});
