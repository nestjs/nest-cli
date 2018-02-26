import { ColorService } from "../../logger/color.service";
import { Logger, LoggerService } from "../../logger/logger.service";

export interface ModuleMetadata {
  modules?: string[];
  controllers?: string[];
  components?: string[];
  exports?: string[];
}

export class ModuleMetadataParser {
  public METADATA_REGEX = new RegExp('@Module\\(([\\s\\S]*?)\\)');

  constructor(
    private logger: Logger = LoggerService.getLogger()
  ) {}

  public parse(content: string): ModuleMetadata {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleMetadataParser.name }::parse() -`, `content : ${ content }`);
    return <ModuleMetadata> JSON.parse(this.format(this.extractMetadataText(content)));
  }

  private format(content: string): string {
    const contentFormat = content
      .replace(/([a-zA-Z]+)/g, '"$1"')
      .replace(/(,)(\n})/, '$2');
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleMetadataParser.name }::format() -`, `contentFormat : ${ contentFormat }`);
    return contentFormat;
  }

  private extractMetadataText(content: string): string {
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleMetadataParser.name }::extractMetadataText() -`, `content : ${ content }`);
    const text = this.METADATA_REGEX.exec(content)[ 1 ];
    this.logger.debug(ColorService.blue('[DEBUG]'), `- ${ ModuleMetadataParser.name }::extractMetadataText() -`, `text : ${ text }`);
    return text;
  }
}