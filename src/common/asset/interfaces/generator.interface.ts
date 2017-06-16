import {Asset} from './asset.interface';

export interface Generator {
  generateFrom(name: string): Promise<void>
  generate(asset: Asset): Promise<void>
}
