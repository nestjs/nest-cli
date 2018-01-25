import { GenerateArguments } from './command';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';
import { ConfigurationLoader } from '../../configuration/configuration.loader';
import { Template } from './template';
import { TemplateLoader } from './template.loader';
import { Asset } from './asset';
import { AssetGenerator } from './asset.generator';
import { TokensGenerator } from './tokens.generator';
import { Token } from './token';
import { TemplateReplacer } from './template.replacer';
import { AssetEmitter } from './asset.emitter';
import { ModuleLoader } from './module.loader';
import { ModuleRegister } from './module.register';
import { ModuleEmitter } from './module.emitter';

export class GenerateHandler {
  constructor(
    private logger: Logger = LoggerService.getLogger(),
    private templateLoader: TemplateLoader = new TemplateLoader(),
    private assetGenerator: AssetGenerator = new AssetGenerator(),
    private tokensGenerator: TokensGenerator = new TokensGenerator(),
    private templateReplacer: TemplateReplacer = new TemplateReplacer(),
    private assetEmitter: AssetEmitter = new AssetEmitter(),
    private moduleLoader: ModuleLoader = new ModuleLoader(),
    private moduleRegister: ModuleRegister = new ModuleRegister(),
    private moduleEmitter: ModuleEmitter = new ModuleEmitter()
  ) {}

  public async handle(args: GenerateArguments) {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ GenerateHandler.name }::handle() -`, 'args :', JSON.stringify(args, null, 2));
    const language: string = ConfigurationLoader.getProperty('language');
    const templates: Template[] = await this.templateLoader.load(args.type, language);
    const assets: Asset[] = templates
      .map((template) => this.assetGenerator.generate(
        {
          type: args.type,
          name: args.name,
          template
        }
      ))
      .map((asset) => {
        const tokens: Token[] = this.tokensGenerator.generate(asset);
        asset.template = Object.assign({}, this.templateReplacer.replace(asset.template, tokens));
        return asset;
      });
    for (const asset of assets) {
      await this.assetEmitter.emit(asset);
    }
    const asset: Asset = assets.find((asset) => asset.filename.indexOf('spec') === -1);
    const module: Asset = await this.moduleLoader.load(asset);
    const registeredModule: Asset = this.moduleRegister.register(asset, module);
    await this.moduleEmitter.emit(registeredModule);
  }
}