import {Asset} from './asset.interface';
import {ControllerAssetReplacer, TestControllerAssetReplacer} from './controller.asset-replacer.interface';

export interface ControllerAsset extends Asset {
  replacer: ControllerAssetReplacer
}

export interface TestControllerAsset extends Asset {
  replacer: TestControllerAssetReplacer
}
