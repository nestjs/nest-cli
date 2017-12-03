import { TokensGenerator } from './tokens.generator';
import { TemplateLoader } from './tamplate.loader';
import { Template, TemplateId, TemplateReplacer, Token } from './template.replacer';
import { FileNameBuilder } from './file-name.builder';
import { ConfigurationLoader } from '../configuration/configuration.loader';

export interface Asset {
  path: string;
  template: Template
}

export class AssetGenerator {
  constructor(
    private tokenGenerator: TokensGenerator = new TokensGenerator(),
    private templateLoader: TemplateLoader = new TemplateLoader(),
    private templateReplacer: TemplateReplacer = new TemplateReplacer(),
    private fileNameBuilder: FileNameBuilder = new FileNameBuilder()
  ) {}

  public async generate(type: string, name: string): Promise<Asset[]> {
    const language: string = ConfigurationLoader.getProperty('language');
    const templates: Template[] = await this.generateTemplates(type, name, language);
    return templates.map((template) => {
      return {
        path: this.generatePath(type, name, language, template),
        template: template
      }
    });
  }

  private async generateTemplates(type: string, name: string, language: string): Promise<Template[]> {
    const tokens: Token[] = this.tokenGenerator.generateFrom(type, name);
    const templates: Template[] = await this.templateLoader.load(type, language);
    return templates.map((template) => this.templateReplacer.replace(template, tokens));
  }

  private generatePath(type: string, name: string, language: string, template: Template): string {
    return `${ this.fileNameBuilder.buildFrom(type, name) }${ template.id === TemplateId.SPEC ? '.spec' : '' }.${ language }`;
  }
}