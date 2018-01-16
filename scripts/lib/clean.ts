import * as os from 'os';
import * as path from 'path';
import { FileSystemUtils } from '../../src/utils/file-system.utils';

export class Clean {
  public static execute(args: string[]): Promise<void[]> {
    return this.extractFileNames(args)
      .then(fileNames => Promise.all(fileNames.map(filename => this.clean(filename))));
  }

  private static extractFileNames(args: string[]): Promise<string[]> {
    if (os.platform() === 'win32')
      return this.extractWin32PlatformFiles(args);
    else
      return Promise.resolve(args.slice(2, args.length));
  }

  private static extractWin32PlatformFiles(args: string[]): Promise<string[]> {
    const dirname: string = args[2].replace('*', '');
    return FileSystemUtils.readdir(dirname)
      .then(fileNames => fileNames.map(filename => path.join(dirname, filename)));
  }

  private static clean(filename: string): Promise<void> {
    return FileSystemUtils.stat(filename)
      .then(fileStat => {
        if (fileStat.isFile())
          return FileSystemUtils.rm(filename);
        else
          return FileSystemUtils.rmdir(filename);
      })
      .then(() => {
        console.log(` ${ filename } deleted`);
      })
      .catch(error => {
        console.log(` ${ filename } not be deleted`);
      });
  }
}
