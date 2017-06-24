import * as sinon from 'sinon';
import {expect} from 'chai';
import {ModuleFinder} from '../../../../common/asset/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../module.finder';
import {FileSystemUtils} from '../../../utils/file-system.utils';

describe('ModuleFinder', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => sandbox = sinon.sandbox.create());
  afterEach(() => sandbox.restore());

  let finder: ModuleFinder;
  beforeEach(() => finder = new ModuleFinderImpl());

  describe('#findFrom()', () => {
    let readdirStub: sinon.SinonStub;
    beforeEach(() => readdirStub = sandbox.stub(FileSystemUtils, 'readdir'));

    it('should return the first module absolute path from the origin path with module at the same level', () => {
      readdirStub.callsFake(() => Promise.resolve([ 'file.component.ts', 'file.module.ts', 'file.controller.ts' ]));
      return finder.findFrom('path/to/file.controller.ts')
        .then(filename => {
          sinon.assert.calledWith(readdirStub, 'path/to');
          expect(filename).to.be.equal('path/to/file.module.ts');
        });
    });

    it('should return the first module absolute path from the origin path with module at a parent level', () => {
      readdirStub.callsFake((dirname) => {
        if (dirname === 'path/to')
          return Promise.resolve([ 'file.component.ts', 'file.controller.ts' ]);
        else {
          return Promise.resolve([ 'file.module.ts' ]);
        }
      });
      return finder.findFrom('path/to/file.controller.ts')
        .then(filename => {
          sinon.assert.calledWith(readdirStub, 'path/to');
          sinon.assert.calledWith(readdirStub, 'path');
          expect(filename).to.be.equal('path/file.module.ts');
        });
    });
  });

  describe('#find()', () => {
    let readdirStub: sinon.SinonStub;
    beforeEach(() => readdirStub = sandbox.stub(FileSystemUtils, 'readdir'));

    it('should return the app module filename', () => {
      readdirStub.callsFake(() => Promise.resolve([
        'app',
        'filename1',
        'filename2'
      ]));
      return finder.find('app')
        .then(filename => {
          expect(filename).to.be.equal('src/app/app.module.ts');
        });
    });

    it.skip('should return the requested module name filename in app modules', () => {
      readdirStub.callsFake(() => {
        if (readdirStub.callCount === 1) {
          return Promise.resolve([
            'app',
            'filename1',
            'filename2'
          ]);
        } else if (readdirStub.callCount === 2) {
          return Promise.resolve([
            'app.module.ts',
            'modules'
          ]);
        } else {
          return Promise.resolve([
            'module1',
            'module2',
            'module3'
          ]);
        }
      });
      return finder.find('module1')
        .then(filename => {
          expect(filename).to.be.equal('src/app/modules/module1/module1.module.ts');
        });
    });
  });
});
