import { Reader, ReaderFileLackPermissionsError } from '../readers';
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

  public load(name?: string): Required<Configuration> {
    const cacheEntryKey = `${this.reader.constructor.name}:${name}`;
    const cachedConfig = loadedConfigsCache.get(cacheEntryKey);
    if (cachedConfig) {
      return cachedConfig;
    }

    let loadedConfig: Required<Configuration> | undefined;

    const contentOrError = name
      ? this.reader.read(name)
      : this.reader.readAnyOf([
          'nest-cli.json',
          '.nestcli.json',
          '.nest-cli.json',
          'nest.json',
        ]);

    if (contentOrError) {
      const isMissingPermissionsError =
        contentOrError instanceof ReaderFileLackPermissionsError;
      if (isMissingPermissionsError) {
        console.error(contentOrError.message);
        process.exit(1);
      }

      const fileConfig = JSON.parse(contentOrError);
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
