import { ModuleMetadata, ModuleMetadataParser } from './module-metadata.parser';
import { Asset } from './asset.generator';

export class ModuleMetadataRegister {
  constructor(
    private parser: ModuleMetadataParser = new ModuleMetadataParser()
  ) {}

  public register(asset: Asset): Asset {
    const metadata: ModuleMetadata = this.parser.parse(asset.module.template.content);
    const updatedMetadata: ModuleMetadata = this.updateMetadata(Object.assign({}, metadata), asset);
    return this.updateAssetModuleContent(metadata, updatedMetadata, Object.assign({}, asset));
  }

  private updateMetadata(metadata: ModuleMetadata, asset: Asset): ModuleMetadata {
    if (asset.type === 'controller') {
      metadata.controllers = metadata.controllers !== undefined ? [ ...metadata.controllers, asset.className ] : [ asset.className ];
    }
    return metadata;
  }

  private updateAssetModuleContent(oldMetadata: ModuleMetadata, updatedMetadata: ModuleMetadata, asset: Asset): Asset {
    asset.module.template.content = asset.module.template.content.replace(JSON.stringify(oldMetadata), JSON.stringify(updatedMetadata, null, 2).replace(/"/g, ''));
    return asset;
  }
}