import {Asset} from './asset.interface';
import {ComponentAssetReplacer, TestComponentAssetReplacer} from './component.asset-replacer.interface';

export interface ComponentAsset extends Asset {
  replacer: ComponentAssetReplacer
}

export interface TestComponentAsset extends Asset {
  replacer: TestComponentAssetReplacer
}
