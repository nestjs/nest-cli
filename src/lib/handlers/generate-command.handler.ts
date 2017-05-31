import {CommandHandler} from '../../common/interfaces/command.handler.interface';
import {AssetEnum} from '../../common/enums/asset.enum';
import {AssetGenerator} from '../../core/generators/asset.generator';
import {Logger} from '../../common/interfaces/logger.interface';
import {LoggerService} from '../../core/loggers/logger.service';

const ASSETS_MAP: Map<string, AssetEnum> = new Map<string, AssetEnum>([
  [ 'module', AssetEnum.MODULE ],
  [ 'controller', AssetEnum.CONTROLLER ],
  [ 'component', AssetEnum.COMPONENT ],
]);

export class GenerateCommandHandler implements CommandHandler {
  public execute(args: any, options: any, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    const asset: AssetEnum = ASSETS_MAP.get(args.asset);
    const name: string = args.name;
    return new AssetGenerator(asset).generate(name);
  }
}
