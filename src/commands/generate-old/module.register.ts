import { ModuleImportRegister } from './module-import.register';
import { ModuleMetadataRegister } from './module-metadata.register';
import { Asset } from './asset';
import { Logger, LoggerService } from "../../logger/logger.service";
import { ColorService } from "../../logger/color.service";

export class ModuleRegister {
  constructor(
    private logger: Logger = LoggerService.getLogger(),
    private importRegister: ModuleImportRegister = new ModuleImportRegister(),
    private metadataRegister: ModuleMetadataRegister = new ModuleMetadataRegister()
  ) {}

  public register(asset: Asset, module: Asset): Asset {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleRegister.name }::register() -`, `asset : ${ JSON.stringify(asset, null, 2) }`, `module : ${ JSON.stringify(module, null, 2) }`);
    let toReturn: Asset = this.importRegister.register(asset, Object.assign({}, module));
    return this.metadataRegister.register(asset, toReturn);
  }
}