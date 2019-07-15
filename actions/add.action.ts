import { Input } from '../commands';
import {
  AbstractPackageManager,
  PackageManagerFactory,
} from '../lib/package-managers';
import {
  AbstractCollection,
  CollectionFactory,
  SchematicOption,
} from '../lib/schematics';
import { AbstractAction } from './abstract.action';

export class AddAction extends AbstractAction {
  public async handle(inputs: Input[]) {
    const manager: AbstractPackageManager = await PackageManagerFactory.find();
    const libraryInput: Input = inputs.find(
      input => input.name === 'library',
    ) as Input;

    if (!libraryInput) {
      return;
    }
    const library: string = libraryInput.value as string;
    await manager.addProduction([library], 'latest');

    const packageName = library.startsWith('@')
      ? library.split('/', 2).join('/')
      : library.split('/', 1)[0];

    // Remove the tag/version from the package name.
    const collectionName =
      (packageName.startsWith('@')
        ? packageName.split('@', 2).join('@')
        : packageName.split('@', 1).join('@')) +
      library.slice(packageName.length);

    const schematicName = 'nest-add';
    try {
      const collection: AbstractCollection = CollectionFactory.create(
        collectionName,
      );
      const schematicOptions: SchematicOption[] = [];
      await collection.execute(schematicName, schematicOptions);
    } catch (e) {
      return;
    }
  }
}
