import { TemplateLoader } from './tamplate.loader';
import { ConfigurationLoader } from '../configuration/configuration.loader';
import { LoggerService } from '../logger/logger.service';
import { Logger } from '../logger/logger.interface';
import { ColorService } from '../logger/color.service';
import { GenerateArguments } from './command';
import { Template, TemplateReplacer, Token } from './template.replacer';
import { TokensGenerator } from './tokens.generator';

export class GenerateHandler {
  constructor(
    private logger: Logger = LoggerService.getLogger(),
    private templateLoader: TemplateLoader = new TemplateLoader(),
    private tokenGenerator: TokensGenerator = new TokensGenerator(),
    private templateReplacer: TemplateReplacer = new TemplateReplacer()
  ) {}

  public async handle(args: GenerateArguments) {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'generate asset :', JSON.stringify(args, null, 2));
    const templates: Template[] = await this.generateTemplates(args);
  }

  private async generateTemplates(args: GenerateArguments): Promise<Template[]> {
    const language: string = ConfigurationLoader.getProperty('language');
    const tokens: Token[] = this.tokenGenerator.generateFrom(args.type, args.name);
    const templates: Template[] = await this.templateLoader.load(args.type, language);
    return templates.map((template) => this.templateReplacer.replace(template, tokens));
  }
}