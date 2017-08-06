import {Asset} from './asset.interface';

export interface ModuleUpdater {
  update(moduleFilename: string, asset: Asset): Promise<void>
}
