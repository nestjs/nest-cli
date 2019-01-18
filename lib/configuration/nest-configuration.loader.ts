import { Reader } from '../readers';
import { Configuration } from './configuration';
import { ConfigurationLoader } from './configuration.loader';
import { defaultConfiguration } from './defaults';

export class NestConfigurationLoader implements ConfigurationLoader {
  constructor(private readonly reader: Reader) {}

  public async load(): Promise<Configuration> {
    const content: string | undefined = await this.reader.readAnyOf([
      '.nestcli.json',
      '.nest-cli.json',
      'nest-cli.json',
      'nest.json',
    ]);
    if (!content) {
      return defaultConfiguration;
    }
    return {
      ...defaultConfiguration,
      ...JSON.parse(content),
    };
  }
}
