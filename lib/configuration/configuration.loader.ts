import { Configuration } from './configuration.js';

export interface ConfigurationLoader {
  load(
    name?: string,
  ): Required<Configuration> | Promise<Required<Configuration>>;
}
