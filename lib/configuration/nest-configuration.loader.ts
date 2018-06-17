import { Reader } from '../readers';
import { Configuration } from './configuration';
import { ConfigurationLoader } from './configuration.loader';

export class NestConfigurationLoader implements ConfigurationLoader {
  constructor(private readonly reader: Reader) {}
  public async load(): Promise<Configuration> {
    const content: string = await this.reader.read('.nestcli.json');
    return JSON.parse(content);
  }
}
