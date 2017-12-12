import { ModuleImportRegister } from './module-import.register';
import { ModuleMetadataRegister } from './module-metadata.register';
import { Asset } from './asset.generator';

export class AssetRegister {
  constructor(
    private importRegister: ModuleImportRegister = new ModuleImportRegister(),
    private metadataRegister: ModuleMetadataRegister = new ModuleMetadataRegister()
  ) {}

  public register(asset: Asset) {
    asset = this.importRegister.register(asset);
    asset = this.metadataRegister.register(asset);
    return asset;
  }
}