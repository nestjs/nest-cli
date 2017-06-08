import {ModuleUpdater} from '../../common/interfaces/module.updater.interface';
import {ModuleFinder} from '../../common/interfaces/module.finder.interface';
import {ModuleFinderImpl} from '../module-finders/module.finder';
import * as fs from 'fs';

export class ComponentUpdater implements ModuleUpdater {
  private finder: ModuleFinder = new ModuleFinderImpl();

  constructor() {}

  public update(filename: string, className: string): Promise<void> {
    return this.finder.findFrom(filename)
      .then(moduleFilename => {
        const reader: fs.ReadStream = fs.createReadStream(moduleFilename);
      });
  }
}
