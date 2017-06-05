import {ModuleUpdater} from '../../common/interfaces/module.updater.interface';

export class ComponentUpdater implements ModuleUpdater {
  public update(className: any): Promise<void> {
    throw new Error("Method not implemented.");
  }

}
