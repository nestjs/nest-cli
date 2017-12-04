import * as fs from 'fs';
import * as path from 'path';

export class ConfigurationEmitter {
  constructor() {}

  public async emit(name: string) {
    await new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(process.cwd(), name, 'nestconfig.json'),
        JSON.stringify({ language: 'ts', entryFile: 'src/server.ts' }, null, 2),
        (error: NodeJS.ErrnoException) => {
          if (error !== undefined && error !== null) {
            return reject(error);
          } else {
            return resolve();
          }
        }
      );
    });
  }
}