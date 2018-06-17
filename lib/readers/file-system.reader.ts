import * as fs from 'fs';
import { Reader } from './reader';

export class FileSystemReader implements Reader {
  constructor(private readonly directory: string) {}
  public async list(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(this.directory, (error: NodeJS.ErrnoException, filenames: string[]) => {
        if (!!error) {
          reject(error);
        } else {
          resolve(filenames);
        }
      });
    });
  }
  public async read(name: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(`${ this.directory }/${ name }`, (error: NodeJS.ErrnoException, data: Buffer) => {
        if (!!error) {
          reject(error);
        } else {
          resolve(data.toString());
        }
      });
    });
  }
}
