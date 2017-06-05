import {ModuleFinder} from '../../../common/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../../module-finders/module.finder';

describe('ModuleFinder', () => {
  it('can be created', () => {
    const finder: ModuleFinder = new ModuleFinderImpl();
  });

  describe('#findFrom()', () => {
    it('should return first the module absolute path from the origin path', () => {
      
    });
  });
});
