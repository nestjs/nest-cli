import { Configuration, ConfigurationLoader } from '../configuration/index.js';
import { NestConfigurationLoader } from '../configuration/nest-configuration.loader.js';
import { FileSystemReader } from '../readers/index.js';

export async function loadConfiguration(): Promise<Required<Configuration>> {
  const loader: ConfigurationLoader = new NestConfigurationLoader(
    new FileSystemReader(process.cwd()),
  );
  return loader.load();
}
