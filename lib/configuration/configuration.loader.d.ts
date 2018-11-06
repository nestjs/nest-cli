import { Configuration } from './configuration';
export interface ConfigurationLoader {
    load(): Configuration | Promise<Configuration>;
}
