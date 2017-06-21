import {AssetReplacer} from './asset-replacer.interface';

export interface ComponentAssetReplacer extends AssetReplacer {

}

export interface TestComponentAssetReplacer extends AssetReplacer {
  __IMPORT__: string
}
