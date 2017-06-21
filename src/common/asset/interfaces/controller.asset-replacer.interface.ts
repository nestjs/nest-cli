import {AssetReplacer} from './asset-replacer.interface';

export interface ControllerAssetReplacer extends AssetReplacer {
  __URI_PATH__: string
}

export interface TestControllerAssetReplacer extends AssetReplacer {
  __IMPORT__: string
}
