import { Reader } from '../readers';
import { Configuration } from './configuration';
import { ConfigurationLoader } from './configuration.loader';
import { Schema } from 'joi';

export class NestConfigurationLoader implements ConfigurationLoader {
  constructor(
    private readonly reader: Reader,
    private readonly configurationSchema: Schema<any>,
  ) {}

  private validateConfiguration(configuration: Configuration): Configuration {
    const { error, value } = this.configurationSchema.validate(configuration);
    if (error) throw error;
    return value;
  }

  public async load(name?: string): Promise<Required<Configuration>> {
    const content =
      (name
        ? await this.reader.read(name)
        : await this.reader.readAnyOf([
            '.nestcli.json',
            '.nest-cli.json',
            'nest-cli.json',
            'nest.json',
          ])) || '{}';
    const fileConfig = JSON.parse(content);
    return this.validateConfiguration(fileConfig);
  }
}
