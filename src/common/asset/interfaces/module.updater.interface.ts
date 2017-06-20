import {AssetEnum} from '../enums/asset.enum';

export interface ModuleUpdater {
  update(filename: string, className: string, asset: AssetEnum): Promise<void>
}
