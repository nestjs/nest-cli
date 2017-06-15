import {Asset} from '../../../common/asset/interfaces/asset.interface';
import {ControllerAssetReplacer, TestControllerAssetReplacer} from '../replacers/controller.asset-replacer.interface';

export interface ControllerAsset extends Asset {
  replacer: ControllerAssetReplacer
}

export interface TestControllerAsset extends Asset {
  replacer: TestControllerAssetReplacer
}
