import { AbstractAction } from './abstract.action';
import { CollectionFactory, Collection, SchematicOption, AbstractCollection } from '../lib/schematics';
import { Input } from '../commands';

interface Inputs {
  schematic: string;
  name: string;
  path?: string;
}

interface Options {
  dryRun?: boolean
}

export class GenerateAction extends AbstractAction {
  public async handle(inputs: Input[], options: Input[]) {
    // await generate(args, options);
  }
}

const generate = async (args: Inputs, options: Options) => {
  const collection: AbstractCollection = CollectionFactory.create(Collection.NESTJS);
  const schematicOptions: SchematicOption[] = parse(args, options);
  await collection.execute(args.schematic, schematicOptions);
}

const parse = (args: Inputs, options: Options) => {
  const schematicOptions: SchematicOption[] = [];
  Object.keys(args).forEach((key) => {
    if (key !== 'schematic') {
      schematicOptions.push(new SchematicOption(key, args[ key ]));
    }
  });
  Object.keys(options).forEach((key) => {
    schematicOptions.push(new SchematicOption(key, options[ key ] !== undefined));
  });
  return schematicOptions;
}
