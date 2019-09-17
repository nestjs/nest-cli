import { Configuration } from './configuration';

export interface ConfigurationLoader {
  load(): Required<Configuration> | Promise<Required<Configuration>>;
}
