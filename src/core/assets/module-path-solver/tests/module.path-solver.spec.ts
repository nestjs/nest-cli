import {ModulePathSolver} from '../../../../common/asset/interfaces/module.path-solver.interface';
import {ModulePathSolverImpl} from '../module.path-solver';
import {expect} from 'chai';

describe('ModulePathSolver', () => {
  let solver: ModulePathSolver;
  beforeEach(() => solver = new ModulePathSolverImpl());

  describe('#resolve()', () => {
    it('should return the app directory path', () => {
      const moduleName: string = 'app';
      expect(solver.resolve(moduleName)).to.be.equal('src/app');
    });

    it('should return the app sub module path', () => {
      const moduleName: string = 'moduleName';
      expect(solver.resolve(moduleName)).to.be.equal(`src/app/modules/moduleName`);
    });

    it('should return the sub module of app sub-module path', () => {
      const moduleName: string = 'moduleName1/moduleName2/moduleName3';
      expect(solver.resolve(moduleName)).to.be.equal(`src/app/modules/moduleName1/modules/moduleName2/modules/moduleName3`);
    });
  });
});
