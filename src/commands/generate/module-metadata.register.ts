import { ModuleMetadata, ModuleMetadataParser } from './module-metadata.parser';
import { Asset } from './asset';

export class ModuleMetadataRegister {
  constructor(
    private parser: ModuleMetadataParser = new ModuleMetadataParser()
  ) {}

  public register(asset: Asset, module: Asset): Asset {
    const metadata: ModuleMetadata = this.parser.parse(module.template.content);
    const updatedMetadata: ModuleMetadata = this.updateMetadata(Object.assign({}, metadata), asset);
    return this.updateModule(updatedMetadata, Object.assign({}, module));
  }

  private updateMetadata(metadata: ModuleMetadata, asset: Asset): ModuleMetadata {
    if (asset.type === 'controller') {
      metadata.controllers = metadata.controllers !== undefined ? [ ...metadata.controllers, asset.className ] : [ asset.className ];
    } else if (asset.type === 'module') {
      metadata.modules = metadata.modules !== undefined ? [ ...metadata.modules, asset.className ] : [ asset.className ];
    } else if (asset.type === 'service' || asset.type === 'component') {
      metadata.components = metadata.components !== undefined ? [ ...metadata.components, asset.className ] : [ asset.className ];
    }
    return metadata;
  }

  private updateModule(updatedMetadata: ModuleMetadata, module: Asset): Asset {
    module.template.content = module.template.content.replace(this.parser.METADATA_REGEX, `@Module(${ JSON.stringify(updatedMetadata, null, 2).replace(/"/g, '') })`);
    return module;
  }
}