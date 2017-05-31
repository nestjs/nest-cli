import {Asset} from '../../common/interfaces/asset.interface';
import {ModuleAssetReplacer} from '../replacers/module.asset-replacer.interface';

export interface ModuleAsset extends Asset {
  replacer: ModuleAssetReplacer
}
