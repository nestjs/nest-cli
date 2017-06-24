import {AssetEnum} from '../enums/asset.enum';
import {Asset} from './asset.interface';

export interface ModuleUpdater {
  updateV1(filename: string, className: string, asset: AssetEnum): Promise<void>
  updateV2(moduleFilename: string, asset: Asset): Promise<void>
}
