import {Asset} from './asset.interface';

export interface Generator {
  generate(asset: Asset): Promise<void>
}
