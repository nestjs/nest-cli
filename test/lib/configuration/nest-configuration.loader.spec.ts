import { Configuration, ConfigurationLoader } from '../../../lib/configuration';

export class NestConfigurationLoader implements ConfigurationLoader {
  public load(): Configuration {
    return undefined;
  }
}

describe('Nest Configuration Loader', () => {
  it('can be created', () => {
    const loader: ConfigurationLoader = new NestConfigurationLoader();
  });
  it('can call load()', () => {
    const loader: ConfigurationLoader = new NestConfigurationLoader();
  });
});
