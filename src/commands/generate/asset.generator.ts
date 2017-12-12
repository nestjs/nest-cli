import { TokensGenerator } from './tokens.generator';
import { TemplateLoader } from './template.loader';
import { Template, TemplateId, TemplateReplacer, Token } from './template.replacer';
import { FileNameGenerator } from './file-name.generator';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';
import { ConfigurationLoader } from '../../configuration/configuration.loader';

export interface Asset {
  className?: string;
  type?: string;
  name?: string;
  path: string;
  template: Template;
  module?: Asset
}

export class AssetGenerator {
  constructor(
    private logger: Logger = LoggerService.getLogger(),
    private tokenGenerator: TokensGenerator = new TokensGenerator(),
    private templateLoader: TemplateLoader = new TemplateLoader(),
    private templateReplacer: TemplateReplacer = new TemplateReplacer(),
    private fileNameBuilder: FileNameGenerator = new FileNameGenerator()
  ) {}

  public async generate(type: string, name: string): Promise<Asset[]> {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'generate', type, 'asset', name);
    const language: string = ConfigurationLoader.getProperty('language');
    const templates: Template[] = await this.generateTemplates(type, name, language);
    this.logger.debug(ColorService.blue('[DEBUG]'), 'generated templates', JSON.stringify(templates, null, 2));
    return templates.map((template) => {
      return {
        path: this.generatePath(type, name, language, template),
        template: template
      }
    });
  }

  private async generateTemplates(type: string, name: string, language: string): Promise<Template[]> {
    const tokens: Token[] = this.tokenGenerator.generate(type, name);
    const templates: Template[] = await this.templateLoader.load(type, language);
    this.logger.debug(ColorService.blue('[DEBUG]'), 'loaded templates', JSON.stringify(templates, null, 2));
    return templates.map((template) => this.templateReplacer.replace(template, tokens));
  }

  private generatePath(type: string, name: string, language: string, template: Template): string {
    return `${ this.fileNameBuilder.generate(type, name) }${ template.id === TemplateId.SPEC ? '.spec' : '' }.${ language }`;
  }
}