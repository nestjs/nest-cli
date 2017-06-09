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

  public static mkdir(target: string): Promise<string> {
    return target
      .split(path.sep)
      .reduce((previous: Promise<string>, child: string) => {
        return previous.then(parent => {
          const current: string = path.resolve(parent, child);
          return this.mkdirProcess(current);
        });
      }, Promise.resolve(''));
  }

  private static mkdirProcess(target: string): Promise<string> {
    return this.stat(target)
      .then(() => target)
      .catch(() => this.fsmkdir(target).then(() => target));
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

  public static readdir(dirname: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(dirname, (error: NodeJS.ErrnoException, files: string[]) => {
        if (!isNullOrUndefined(error))
          reject(error);
        else
          resolve(files);
      });
    });
  }

  public static rm(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.unlink(filename, (error: NodeJS.ErrnoException) => {
        if (!isNullOrUndefined(error))
          reject(error);
        else
          resolve();
      });
    });
  }
}
