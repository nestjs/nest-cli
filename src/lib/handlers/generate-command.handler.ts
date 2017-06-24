import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {AssetEnum} from '../../common/asset/enums/asset.enum';
import {CommandArguments} from '../../common/program/interfaces/command.aguments.interface';
import {CommandOptions} from '../../common/program/interfaces/command.options.interface';
import {Logger} from '../../common/logger/interfaces/logger.interface';
import {ModuleProcessor} from '../../core/assets/processors/module.processor';
import {ControllerProcessor} from '../../core/assets/processors/controller.processor';
import {ComponentProcessor} from '../../core/assets/processors/component.processor';
import {ConfigurationService} from '../../core/configuration/configuration.service';
import {LoggerService} from '../../core/logger/logger.service';

const ASSETS_MAP: Map<string, AssetEnum> = new Map<string, AssetEnum>([
  [ 'module', AssetEnum.MODULE ],
  [ 'controller', AssetEnum.CONTROLLER ],
  [ 'component', AssetEnum.COMPONENT ],
]);

export interface GenerateCommandArguments extends CommandArguments {
  assetType: string
  assetName: string
  moduleName: string
}

export interface GenerateCommandOptions extends CommandOptions {}

export class GenerateCommandHandler implements CommandHandler {
  public execute(args: GenerateCommandArguments, options: GenerateCommandOptions, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    return ConfigurationService.load()
      .then(() => {
        const assetType: AssetEnum = ASSETS_MAP.get(args.assetType);
        const assetName: string = args.assetName;
        const moduleName: string = args.moduleName || 'app';
        const language: string = ConfigurationService.getProperty('language');
        switch (assetType) {
          case AssetEnum.MODULE:
            return new ModuleProcessor(assetName, language).process();
          case AssetEnum.CONTROLLER:
            return new ControllerProcessor(assetName, language).process();
          case AssetEnum.COMPONENT:
            return new ComponentProcessor(assetName, language).process();
        }
      });
  }
}
