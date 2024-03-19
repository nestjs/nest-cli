import * as fs from 'fs';
import * as path from 'path';
import { Reader, ReaderFileLackPermissionsError } from './reader';

export class FileSystemReader implements Reader {
  constructor(private readonly directory: string) {}

  public list(): string[] {
    return fs.readdirSync(this.directory);
  }

  public read(name: string): string {
    return fs.readFileSync(path.join(this.directory, name), 'utf8');
  }

  public readAnyOf(
    filenames: string[],
  ): string | undefined | ReaderFileLackPermissionsError {
    let firstFilePathFoundButWithInsufficientPermissions: string | undefined;

    for (let id = 0; id < filenames.length; id++) {
      const file = filenames[id];

      try {
        return this.read(file);
      } catch (readErr) {
        if (
          !firstFilePathFoundButWithInsufficientPermissions &&
          typeof readErr?.code === 'string'
        ) {
          const isInsufficientPermissionsError =
            readErr.code === 'EACCES' || readErr.code === 'EPERM';
          if (isInsufficientPermissionsError) {
            firstFilePathFoundButWithInsufficientPermissions = readErr.path;
          }
        }

        const isLastFileToLookFor = id === filenames.length - 1;
        if (!isLastFileToLookFor) {
          continue;
        }

        if (firstFilePathFoundButWithInsufficientPermissions) {
          return new ReaderFileLackPermissionsError(
            firstFilePathFoundButWithInsufficientPermissions,
            readErr.code,
          );
        } else {
          return undefined;
        }
      }
    }
  }
}
