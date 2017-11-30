import { TemplateLoader } from './tamplate.loader';
import { ConfigurationLoader } from '../configuration/configuration.loader';
import { LoggerService } from '../logger/logger.service';
import { Logger } from '../common/logger/interfaces/logger.interface';
import { ColorService } from '../logger/color.service';
import { GenerateArguments } from './command';

export class GenerateHandler {
  constructor(
    private logger: Logger = LoggerService.getLogger(),
    private templateLoader: TemplateLoader = new TemplateLoader()
  ) {}

  public async handle(args: GenerateArguments) {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'generate asset :', JSON.stringify(args.type, null, 2));
    const language: string = ConfigurationLoader.getProperty('language');
    const templates: any = this.templateLoader.load(args.type, language);
  }
}