import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {AssetEnum} from '../../common/asset/enums/asset.enum';
import {GenerateCommandArguments} from '../../common/program/interfaces/command.aguments.interface';
import {Logger} from '../../common/logger/interfaces/logger.interface';
import {ModuleProcessor} from '../../core/assets/processors/module.processor';
import {ControllerProcessor} from '../../core/assets/processors/controller.processor';
import {ComponentProcessor} from '../../core/assets/processors/component.processor';
import {ConfigurationService} from '../../core/configuration/configuration.service';
import {LoggerService} from '../../core/logger/logger.service';
import {ColorService} from '../../core/logger/color.service';
import {PipeProcessor} from '../../core/assets/processors/pipe.processor';
import {MiddlewareProcessor} from '../../core/assets/processors/middleware.processor';
import {GatewayProcessor} from '../../core/assets/processors/gateway.processor';
import {GenerateCommandOptions} from '../../../bin/lib/handlers/generate-command.handler';

const ASSETS_MAP: Map<string, AssetEnum> = new Map<string, AssetEnum>([
  [ 'module', AssetEnum.MODULE ],
  [ 'controller', AssetEnum.CONTROLLER ],
  [ 'component', AssetEnum.COMPONENT ],
  [ 'pipe' , AssetEnum.PIPE ],
  [ 'middleware', AssetEnum.MIDDLEWARE ],
  [ 'gateway', AssetEnum.GATEWAY ]
]);

export class GenerateCommandHandler implements CommandHandler {
  public execute(args: GenerateCommandArguments, options: GenerateCommandOptions, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    logger.debug(ColorService.blue('[DEBUG]'), 'launch generate command');
    logger.debug(ColorService.blue('[DEBUG]'), 'arguments :', JSON.stringify(args, null, 2));
    logger.debug(ColorService.blue('[DEBUG]'), 'options   :', JSON.stringify(options, null, 2));
    return ConfigurationService.load()
      .then(() => {
        const assetType: AssetEnum = ASSETS_MAP.get(args.assetType);
        const assetName: string = args.assetName;
        const moduleName: string = args.moduleName || 'app';
        const language: string = ConfigurationService.getProperty('language');
        switch (assetType) {
          case AssetEnum.MODULE:
            return new ModuleProcessor(assetName, moduleName, language).process();
          case AssetEnum.CONTROLLER:
            return new ControllerProcessor(assetName, moduleName, language).process();
          case AssetEnum.COMPONENT:
            return new ComponentProcessor(assetName, moduleName, language).process();
          case AssetEnum.PIPE:
            return new PipeProcessor(assetName, moduleName, language).process();
          case AssetEnum.MIDDLEWARE:
            return new MiddlewareProcessor(assetName, moduleName, language).process();
          case AssetEnum.GATEWAY:
            return new GatewayProcessor(assetName, moduleName, language).process();
          default:
            logger.error(ColorService.red('[ERROR]'), `asset '${ args.assetType }' is not managed.`);
        }
      });
  }
}
