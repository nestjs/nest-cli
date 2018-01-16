import { ModuleImportRegister } from './module-import.register';
import { ModuleMetadataRegister } from './module-metadata.register';
import { Asset } from './asset';

export class ModuleRegister {
  constructor(
    private importRegister: ModuleImportRegister = new ModuleImportRegister(),
    private metadataRegister: ModuleMetadataRegister = new ModuleMetadataRegister()
  ) {}

  public register(asset: Asset, module: Asset): Asset {
    let toReturn: Asset = this.importRegister.register(asset, Object.assign({}, module));
    return this.metadataRegister.register(asset, toReturn);
  }
}