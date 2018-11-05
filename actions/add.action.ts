import { Input } from '../commands';
import {
  AbstractPackageManager,
  PackageManagerFactory,
} from '../lib/package-managers';
import { AbstractAction } from './abstract.action';

export class AddAction extends AbstractAction {
  public async handle(inputs: Input[]) {
    const manager: AbstractPackageManager = await PackageManagerFactory.find();
    const libraryInput: Input = inputs.find(
      input => input.name === 'library',
    ) as Input;
    if (libraryInput) {
      const library: string = libraryInput.value as string;
      await manager.addProduction([library], 'latest');
    }
  }
}
