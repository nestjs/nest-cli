import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as path from 'path';
import {ModulePathSolver} from '../../../common/asset/interfaces/module.path-solver.interface';
import {ModulePathSolverImpl} from '../module-path-solver/module.path-solver';

export class ModuleFinderImpl implements ModuleFinder {
  private MODULE_FILENAME_REGEX = /.*.module.(ts|js)/;

  constructor(private _solver: ModulePathSolver = new ModulePathSolverImpl()) {}

  public find(moduleName: string): Promise<string> {
    const modulePath = this._solver.resolve(moduleName);
    return FileSystemUtils.readdir(path.join(process.cwd(), modulePath))
      .then(files => {
        const filename: string = files.find(filename => this.MODULE_FILENAME_REGEX.test(filename));
        return path.join(modulePath, filename);
      });
  }
}
