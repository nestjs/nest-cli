import * as fs from 'fs';
import { Reader } from './reader';

export class FileSystemReader implements Reader {
  constructor(private readonly directory: string) {}

  public async list(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(
        this.directory,
        (error: NodeJS.ErrnoException | null, filenames: string[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(filenames);
          }
        },
      );
    });
  }

  public async read(name: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(
        `${this.directory}/${name}`,
        (error: NodeJS.ErrnoException | null, data: Buffer) => {
          if (error) {
            reject(error);
          } else {
            resolve(data.toString());
          }
        },
      );
    });
  }

  public async readAnyOf(filenames: string[]): Promise<string | undefined> {
    try {
      for (const file of filenames) {
        return await this.read(file);
      }
    } catch (err) {
      return filenames.length > 0
        ? await this.readAnyOf(filenames.slice(1, filenames.length))
        : undefined;
    }
  }
}
