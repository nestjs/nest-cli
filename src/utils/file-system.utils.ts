import * as fs from 'fs';
import * as path from 'path';
import { isNullOrUndefined } from 'util';

export class FileSystemUtils {
  public static rmdir(name: string): Promise<string> {
    return this.fsrmdir(name)
      .catch(() => {
        return this.readdir(name)
          .then((files: string[]) => {
            return files.reduce((previous: Promise<string>, current: string) => {
              const filename: string = path.join(name, current);
              return previous
                .then(() => {
                  return this.rm(filename);
                })
                .catch(() => {
                  return this.rmdir(filename);
                });
            }, Promise.resolve(''));
          })
          .then(() => {
            return this.rmdir(name)
          });
      });
  }

  private static fsrmdir(dirname: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.rmdir(dirname, (error: NodeJS.ErrnoException) => {
        if (!isNullOrUndefined(error))
          reject(error);
        else
          resolve(dirname);
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

  public static stat(filename: string): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => {
      fs.stat(filename, (error: NodeJS.ErrnoException, stats: fs.Stats) => {
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

  public static readFile(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, (error: NodeJS.ErrnoException, data: Buffer) => {
        if (!isNullOrUndefined(error))
          reject(error);
        else
          resolve(data.toString());
      });
    });
  }

  public static async writeFile(filename: string, content: string) {
    return new Promise((resolve, reject) => {
      fs.appendFile(filename, content, (error: NodeJS.ErrnoException) => {
        if (error !== undefined && error !== null) {
          return reject(error);
        } else {
        resolve();
        }
      });
    });
  }
}
