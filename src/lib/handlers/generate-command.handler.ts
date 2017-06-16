import {AssetGenerator} from '../../core/assets/generators';
import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {AssetEnum} from '../../common/asset/enums/asset.enum';
import {CommandArguments} from '../../common/program/interfaces/command.aguments.interface';
import {CommandOptions} from '../../common/program/interfaces/command.options.interface';
import {Logger} from '../../common/logger/interfaces/logger.interface';

const ASSETS_MAP: Map<string, AssetEnum> = new Map<string, AssetEnum>([
  [ 'module', AssetEnum.MODULE ],
  [ 'controller', AssetEnum.CONTROLLER ],
  [ 'component', AssetEnum.COMPONENT ],
]);

export interface GenerateCommandArguments extends CommandArguments {
  asset: string
  name: string
}

export interface GenerateCommandOptions extends CommandOptions {}

export class GenerateCommandHandler implements CommandHandler {
  public execute(args: GenerateCommandArguments, options: GenerateCommandOptions, logger: Logger): Promise<void> {
    const asset: AssetEnum = ASSETS_MAP.get(args.asset);
    const name: string = args.name;
    return new AssetGenerator(asset).generateFrom(name);
  }
}
