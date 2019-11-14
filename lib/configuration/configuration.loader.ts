import { Configuration } from './configuration';

export interface ConfigurationLoader {
  load(
    name?: string,
  ): Required<Configuration> | Promise<Required<Configuration>>;
}
