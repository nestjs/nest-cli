import * as sinon from 'sinon';
import {expect} from 'chai';
import {ModuleFinder} from '../../../../common/asset/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../module.finder';
import {FileSystemUtils} from '../../../utils/file-system.utils';
import {ModulePathSolverImpl} from '../../module-path-solver/module.path-solver';

describe('ModuleFinder', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let finder: ModuleFinder;
  beforeEach(() => finder = new ModuleFinderImpl());

  describe('#find()', () => {
    let readdirStub: sinon.SinonStub;
    beforeEach(() => {
      readdirStub = sandbox.stub(FileSystemUtils, 'readdir');
    });

    it('should resolve the module path', () => {
      const resolveStub = sandbox.stub(ModulePathSolverImpl.prototype, 'resolve').callsFake(() => 'src/app');
      readdirStub.callsFake(() => Promise.resolve(['app.module.ts']));
      return finder.find('app')
        .then(() => {
          sinon.assert.calledOnce(resolveStub);
        });
    });

    it('should return the app module filename', () => {
      readdirStub.callsFake(() => Promise.resolve([
        'app.module.ts',
        'modules',
        'controllers',
        'components'
      ]));
      return finder.find('app')
        .then(filename => {
          expect(filename).to.be.equal('src/app/app.module.ts');
        });
    });

    it('should return the requested module name filename in app modules', () => {
      readdirStub.callsFake(() => Promise.resolve([ 'module1.module.ts' ]));
      return finder.find('module1')
        .then(filename => {
          expect(filename).to.be.equal('src/app/modules/module1/module1.module.ts');
        });
    });
  });
});
