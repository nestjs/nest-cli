import * as rimraf from 'rimraf';
import * as fs from 'fs';
import {Stats} from 'fs';
import {isNullOrUndefined} from 'util';

export class FileSystemUtils {
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

  static mkdir(path: string): Promise<void> {
    return null;
  }

  static stat(filename: string): Promise<Stats> {
    return new Promise<Stats>((resolve, reject) => {
      fs.stat(filename, (error: NodeJS.ErrnoException, stats: Stats) => {
        if (!isNullOrUndefined(error))
          reject(error);
        else
          resolve(stats);
      });
    });
  }
}
