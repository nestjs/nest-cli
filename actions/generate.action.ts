import { AbstractAction } from './abstract.action';
import { CollectionFactory, Collection, SchematicOption, AbstractCollection } from '../lib/schematics';
import { Input } from '../commands';
import chalk from 'chalk';

export class GenerateAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    await generateFiles(inputs.concat(options));
  }
}

const generateFiles = async (inputs: Input[]) => {
  const collection: AbstractCollection = CollectionFactory.create(Collection.NESTJS);
  const schematicOptions: SchematicOption[] = mapSchematicOptions(inputs);
  const schematic: string = inputs.find((input) => input.name === 'schematic').value as string;
  try {
    await collection.execute(schematic, schematicOptions);
  } catch (error) {
    console.error(chalk.red(error.message));
  }
}

const mapSchematicOptions = (inputs: Input[]): SchematicOption[] => {
  const options: SchematicOption[] = [];
  inputs.forEach((input) => {
    if (input.name !== 'schematic' && input.value !== undefined) {
      options.push(new SchematicOption(input.name, input.value));
    }
  });
  return options;
};
