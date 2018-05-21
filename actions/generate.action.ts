import chalk from 'chalk';
import { Input } from '../commands';
import { AbstractCollection, Collection, CollectionFactory, SchematicOption } from '../lib/schematics';
import { AbstractAction } from './abstract.action';

export class GenerateAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    await generateFiles(inputs.concat(options));
  }
}

const generateFiles = async (inputs: Input[]) => {
  const collection: AbstractCollection = CollectionFactory.create(Collection.NESTJS);
  const schematicOptions: SchematicOption[] = mapSchematicOptions(inputs);

  try {
    const schematicInput = inputs.find((input) => input.name === 'schematic');

    if (!schematicInput) {
      throw new Error('Unable to find a schematic for this configuration');
    }

    await collection.execute(schematicInput.value as string, schematicOptions);
  } catch (error) {
    console.error(chalk.red(error.message));
  }
};

const mapSchematicOptions = (inputs: Input[]): SchematicOption[] => {
  const options: SchematicOption[] = [];
  inputs.forEach((input) => {
    if (input.name !== 'schematic' && input.value !== undefined) {
      options.push(new SchematicOption(input.name, input.value));
    }
  });
  return options;
};
