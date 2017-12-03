import { LoggerService } from '../logger/logger.service';
import { Logger } from '../logger/logger.interface';
import { ColorService } from '../logger/color.service';
import { GenerateArguments } from './command';
import { Asset, AssetGenerator } from './asset.generator';
import { AssetEmitter } from './asset.emitter';

export class GenerateHandler {
  constructor(
    private logger: Logger = LoggerService.getLogger(),
    private assetGenerator: AssetGenerator = new AssetGenerator(),
    private assetEmitter: AssetEmitter = new AssetEmitter()
  ) {}

  public async handle(args: GenerateArguments) {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'generate asset :', JSON.stringify(args, null, 2));
    const assets: Asset[] = await this.assetGenerator.generate(args.type, args.name);
    await this.assetEmitter.emit(args.name, assets);
  }
}