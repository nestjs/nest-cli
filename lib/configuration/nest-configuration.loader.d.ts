import { Reader } from '../readers';
import { Configuration } from './configuration';
import { ConfigurationLoader } from './configuration.loader';
export declare class NestConfigurationLoader implements ConfigurationLoader {
    private readonly reader;
    constructor(reader: Reader);
    load(): Promise<Configuration>;
}
