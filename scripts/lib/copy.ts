import * as fs from 'fs';
import {ReadStream, WriteStream} from 'fs';
import * as path from 'path';
import { FileSystemUtils } from '../../src/utils/file-system.utils';

export class Copy {
  public static execute(argv: string[]): Promise<void> {
    const origin: string = argv[2];
    const destination: string = argv[3];
    return this.copy(origin, destination);
  }

  private static copy(origin: string, destination: string) {
    return FileSystemUtils.stat(origin)
      .then(fileStat => {
        if (fileStat.isFile())
          return this.copyFile(origin, destination);
        else
          return this.copyDirectory(origin, destination);
      });
  }

  private static copyFile(origin: string, destination: string): Promise<void> {
    console.log(` copy ${ origin } \n to   ${ destination }`);
    return new Promise<void>((resolve, reject) => {
      const reader: ReadStream = fs.createReadStream(origin);
      const writer: WriteStream = fs.createWriteStream(destination);
      reader.pipe(writer);
      reader.on('end', resolve);
      reader.on('error', reject);
    });
  }

  private static copyDirectory(origin: string, destination: string): Promise<void> {
    return FileSystemUtils.readdir(origin)
      .then(files => {
        return FileSystemUtils.mkdir(destination)
          .then(() => Promise.all(
            files.map(file => this.copy(path.join(origin, file), path.join(destination, file)))
          ));
      })
      .then(() => {});
  }
}
