import {Asset} from '../../common/interfaces/asset.interface';
import {ComponentAssetReplacer, TestComponentAssetReplacer} from '../replacers/component.asset-replacer.interface';

export interface ComponentAsset extends Asset {
  replacer: ComponentAssetReplacer
}

export interface TestComponentAsset extends Asset {
  replacer: TestComponentAssetReplacer
}
