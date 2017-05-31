import * as rimraf from 'rimraf';

export class FileSytemUtils {
  public static rmdir(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      rimraf(path, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
