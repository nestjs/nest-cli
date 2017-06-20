import {isNullOrUndefined} from 'util';
import Property = Chai.Property;
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as path from 'path';

export class ConfigurationService {
  private static PROPERTIES: Map<string, string> = new Map<string, string>();

  public static load(): Promise<void> {
    return FileSystemUtils.readFile(path.join(process.cwd(), 'nestconfig.json'))
      .then(content => {
        return JSON.parse(content);
      })
      .then(property => {
        Object.keys(property).forEach(key => {
          const value: string = property[key];
          this.PROPERTIES.set(key, value);
        });
      });
  }

  public static getProperty(propertyKey: string): string {
    let propertyValue: string = this.PROPERTIES.get(propertyKey);
    if (isNullOrUndefined(propertyValue))
      throw new Error(`Missing property "${ propertyKey }"`);
    return propertyValue;
  }
}
