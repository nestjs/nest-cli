import chalk from 'chalk';
import { Input } from '../commands';
import { Configuration, ConfigurationLoader } from '../lib/configuration';
import { NestConfigurationLoader } from '../lib/configuration/nest-configuration.loader';
import { FileSystemReader } from '../lib/readers';
import { AbstractCollection, CollectionFactory, SchematicOption } from '../lib/schematics';
import { AbstractAction } from './abstract.action';

export class GenerateAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    await generateFiles(inputs.concat(options));
  }
}

const generateFiles = async (inputs: Input[]) => {
  const configuration: Configuration = await loadConfiguration();
  // @ts-ignore
  const collectionOption = inputs.find(option => option.name === 'collection').value;

  const collection: AbstractCollection = CollectionFactory.create(
    collectionOption || configuration.collection,
  );
  const schematicOptions: SchematicOption[] = mapSchematicOptions(inputs);

  schematicOptions.push(
    new SchematicOption('language', configuration.language),
  );
  schematicOptions.push(
    new SchematicOption('sourceRoot', configuration.sourceRoot),
  );
  try {
    const schematicInput = inputs.find(input => input.name === 'schematic');
    if (!schematicInput) {
      throw new Error('Unable to find a schematic for this configuration');
    }
    await collection.execute(schematicInput.value as string, schematicOptions);
  } catch (error) {
    if (error && error.message) {
      console.error(chalk.red(error.message));
    }
  }
};

const loadConfiguration = async (): Promise<Configuration> => {
  const loader: ConfigurationLoader = new NestConfigurationLoader(
    new FileSystemReader(process.cwd()),
  );
  return loader.load();
};

const mapSchematicOptions = (inputs: Input[]): SchematicOption[] => {
  const options: SchematicOption[] = [];
  inputs.forEach(input => {
    if (input.name !== 'schematic' && input.value !== undefined) {
      options.push(new SchematicOption(input.name, input.value));
    }
  });
  return options;
};
