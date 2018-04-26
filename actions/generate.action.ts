import { AbstractAction } from './abstract.action';
import { CollectionFactory, Collection, SchematicOption } from '../lib/schematics';

interface Inputs {
  schematic: string;
  name: string;
  path?: string;
}

interface Options {
  dryRun?: boolean
}

export class GenerateAction extends AbstractAction {
  public async handle(args: Inputs, options: Options, logger: any) {
    await generate(args, options, logger);
  }
}

const generate = async (args: Inputs, options: Options, logger: any) => {
  const collection = CollectionFactory.create(Collection.NESTJS, logger);
  const schematicOptions = parse(args, options);
  return collection.execute(args.schematic, schematicOptions);
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
