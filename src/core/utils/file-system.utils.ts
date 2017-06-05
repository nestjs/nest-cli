import * as rimraf from 'rimraf';
import * as fs from 'fs';
import {Stats} from 'fs';
import * as path from 'path';
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

  public static mkdir(target: string): Promise<void> {
    return new Promise<void>(resolve => {
      const promises: Promise<void>[] = [];
      target.split(path.sep).reduce((parent: string, child: string) => {
        const current: string = path.resolve(parent, child);
        promises.push(this.createMkDirIterationPromise(current));
        return current;
      }, '');
      Promise.all(promises).then(() => resolve());
    });
  }

  private static createMkDirIterationPromise(target: string): Promise<void> {
    return this.stat(target)
      .catch(() => {
        return this.fsmkdir(target);
      });
  }

  private static fsmkdir(target: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.mkdir(target, (error: NodeJS.ErrnoException) => {
        if (!isNullOrUndefined(error))
          reject(error);
        else
          resolve();
      });
    });
  }

  public static stat(filename: string): Promise<Stats> {
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
