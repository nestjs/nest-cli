import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as path from 'path';
import {isNullOrUndefined} from 'util';

export class ModuleFinderImpl implements ModuleFinder {
  private MODULE_FILENAME_REGEX = /.*.module.(ts|js)/;

  public find(module?: string): Promise<string> {
    if (isNullOrUndefined(module))
      return Promise.resolve('src/app/app.module.ts');
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
