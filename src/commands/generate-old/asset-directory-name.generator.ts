import { Asset } from './asset';
import * as path from 'path';

export class AssetDirectoryNameGenerator {
  constructor() {}

  public generate(asset: Asset): string {
    return path.join(process.cwd(), 'src/modules', asset.name);
  }
}