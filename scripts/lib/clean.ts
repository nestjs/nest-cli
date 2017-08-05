import {FileSystemUtils} from '../../src/core/utils/file-system.utils';
import * as os from 'os';

export class Clean {
  public static execute(args: string[]): Promise<void[]> {
    const fileNames: string[] = args.slice(2, args.length);
    return Promise.all(
      fileNames
        .map(filename => this.format(filename))
        .map(filename => this.clean(filename)
    ));
  }

  private static format(filename: string): string {
    if (os.platform() === 'win32')
      return filename.replace('*', '');
    else
      return filename;
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
