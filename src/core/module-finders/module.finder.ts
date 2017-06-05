import {ModuleFinder} from '../../common/interfaces/module.finder.interface';

export class ModuleFinderImpl implements ModuleFinder {
  public findFrom(origin: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

}
