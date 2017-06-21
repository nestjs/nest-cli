import {Asset} from './asset.interface';
import {ModuleAssetReplacer} from './module.asset-replacer.interface';

export interface ModuleAsset extends Asset {
  replacer: ModuleAssetReplacer
}
