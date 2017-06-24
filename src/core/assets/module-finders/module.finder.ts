import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as path from 'path';
import {isNullOrUndefined} from 'util';
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

  public findFrom(origin: string): Promise<string> {
    const dirname = path.dirname(origin);
    return this.findIn(dirname);
  }

  private findIn(dirname: string): Promise<string> {
    return FileSystemUtils.readdir(dirname)
      .then(files => {
        const filename: string = files.find(filename => this.MODULE_FILENAME_REGEX.test(filename));
        if (isNullOrUndefined(filename)) {
          const elements = dirname.split(path.sep);
          const parent = elements.splice(0, elements.length - 1).join(path.sep);
          return this.findIn(parent);
        } else {
          return path.join(dirname, files.find(filename => this.MODULE_FILENAME_REGEX.test(filename)));
        }
      });
  }

}
