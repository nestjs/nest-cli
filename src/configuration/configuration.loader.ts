import * as path from 'path';
import { FileSystemUtils } from '../utils/file-system.utils';
import * as fs from 'fs';

export class ConfigurationLoader {
  private static PROPERTIES: Map<string, string> = new Map<string, string>();

  public static load(): Promise<void> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(
        path.join(path.join(process.cwd(), 'nestconfig.json')),
        (error: NodeJS.ErrnoException, buffer: Buffer) => {
          if (error) {
            reject(error);
          } else {
            resolve(buffer.toString());
          }
      });
    }).then((content) => JSON.parse(content))
      .then((property) => Object.keys(property).forEach((key) => this.PROPERTIES.set(key, property[key])));
  }

  public static getProperty(key: string): string {
    let value: string = this.PROPERTIES.get(key);
    if (value === undefined || value === null) {
      throw new Error(`Missing property "${ key }"`);
    }
    return value;
  }
}
