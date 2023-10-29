import { Reader } from '../readers';
import { Configuration } from './configuration';
import { ConfigurationLoader } from './configuration.loader';
import { defaultConfiguration } from './defaults';

/**
 * A cache table that maps some reader (by its name along with the config path)
 * to a loaded configuration.
 * This was added because several commands relies on the app's config in order
 * to generate some dynanmic content prior running the command itself.
 */
const loadedConfigsCache = new Map<string, Required<Configuration>>();

export class NestConfigurationLoader implements ConfigurationLoader {
  constructor(private readonly reader: Reader) {}

  public async load(name?: string): Promise<Required<Configuration>> {
    const cacheEntryKey = `${this.reader.constructor.name}:${name}`;
    const cachedConfig = loadedConfigsCache.get(cacheEntryKey);
    if (cachedConfig) {
      return cachedConfig;
    }

    let loadedConfig: Required<Configuration> | undefined;

    const content: string | undefined = name
      ? await this.reader.read(name)
      : await this.reader.readAnyOf([
          'nest-cli.json',
          '.nestcli.json',
          '.nest-cli.json',
          'nest.json',
        ]);

    if (content) {
      const fileConfig = JSON.parse(content);
      if (fileConfig.compilerOptions) {
        loadedConfig = {
          ...defaultConfiguration,
          ...fileConfig,
          compilerOptions: {
            ...defaultConfiguration.compilerOptions,
            ...fileConfig.compilerOptions,
          },
        };
      } else {
        loadedConfig = {
          ...defaultConfiguration,
          ...fileConfig,
        };
      }
    } else {
      loadedConfig = defaultConfiguration;
    }

    loadedConfigsCache.set(cacheEntryKey, loadedConfig!);
    return loadedConfig!;
  }
}
