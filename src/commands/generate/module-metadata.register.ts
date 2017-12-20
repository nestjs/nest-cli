import { ModuleMetadata, ModuleMetadataParser } from './module-metadata.parser';
import { Asset } from './asset';

export class ModuleMetadataRegister {
  constructor(
    private parser: ModuleMetadataParser = new ModuleMetadataParser()
  ) {}

  public register(asset: Asset, module: Asset): Asset {
    const metadata: ModuleMetadata = this.parser.parse(module.template.content);
    const updatedMetadata: ModuleMetadata = this.updateMetadata(Object.assign({}, metadata), asset);
    return this.updateModule(metadata, updatedMetadata, Object.assign({}, module));
  }

  private updateMetadata(metadata: ModuleMetadata, asset: Asset): ModuleMetadata {
    if (asset.type === 'controller') {
      metadata.controllers = metadata.controllers !== undefined ? [ ...metadata.controllers, asset.className ] : [ asset.className ];
    }
    return metadata;
  }

  private updateModule(oldMetadata: ModuleMetadata, updatedMetadata: ModuleMetadata, module: Asset): Asset {
    module.template.content = module.template.content.replace(JSON.stringify(oldMetadata), JSON.stringify(updatedMetadata, null, 2).replace(/"/g, ''));
    return module;
  }
}