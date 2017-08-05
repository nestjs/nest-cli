import {FileSystemUtils} from '../../src/core/utils/file-system.utils';

export class Clean {
  public static execute(args: string[]): Promise<void[]> {
    const fileNames: string[] = args.slice(2, args.length);
    return Promise.all(fileNames.map(filename => this.clean(filename)));
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
        console.log(`${ filename } deleted`);
      })
      .catch(error => {
        console.log(`${ filename } not be deleted`);
      });
  }
}
