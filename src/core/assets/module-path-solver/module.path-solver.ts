import {ModulePathSolver} from '../../../common/asset/interfaces/module.path-solver.interface';
import * as path from 'path';

export class ModulePathSolverImpl implements ModulePathSolver {
  private ROOT_PATH: string = 'src/app';
  private DEFAULT_MODULE_NAME: string = 'app';

  public resolve(modulePath: string): string {
    if (modulePath === this.DEFAULT_MODULE_NAME)
      return this.ROOT_PATH;
    else
      return path.join(this.ROOT_PATH, 'modules', modulePath.split(path.sep).join(path.sep.concat('modules').concat(path.sep)));
  }

}
