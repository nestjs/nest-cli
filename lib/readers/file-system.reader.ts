import * as fs from 'fs';
import * as path from 'path';
import { Reader } from './reader';

export class FileSystemReader implements Reader {
  constructor(private readonly directory: string) {}

  public list(): string[] {
    return fs.readdirSync(this.directory);
  }

  public read(name: string): string {
    return fs.readFileSync(path.join(this.directory, name), 'utf8');
  }

  public readAnyOf(filenames: string[]): string | undefined {
    try {
      for (const file of filenames) {
        return this.read(file);
      }
    } catch (err) {
      return filenames.length > 0
        ? this.readAnyOf(filenames.slice(1, filenames.length))
        : undefined;
    }
  }
}
