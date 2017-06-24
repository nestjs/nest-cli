import {ModuleFinder} from '../../../common/asset/interfaces/module.finder.interface';
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as path from 'path';
import {isNullOrUndefined} from 'util';

export class ModuleFinderImpl implements ModuleFinder {
  private MODULE_FILENAME_REGEX = /.*.module.(ts|js)/;
  private ROOT_DIRECTORY_NAME = 'src';

  public find(moduleName: string): Promise<string> {
    const rootDirectoryPath: string = path.join(process.cwd(), this.ROOT_DIRECTORY_NAME);
    return FileSystemUtils.readdir(rootDirectoryPath)
      .then(files => {
        const filename: string = files.find(filename => filename === moduleName);
        if (!isNullOrUndefined(filename))

          return Promise.resolve(`${ this.ROOT_DIRECTORY_NAME }/${ moduleName }/${ moduleName }.module.ts`);
      });
  }

  private buildRegex(moduleName: string): RegExp {
    return new RegExp(`${ moduleName }.module.(ts|js)`);
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
