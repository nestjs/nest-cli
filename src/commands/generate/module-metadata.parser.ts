export interface ModuleMetadata {
  modules?: string[];
  controllers?: string[];
  components?: string[];
  exports?: string[];
}

export class ModuleMetadataParser {
  public METADATA_REGEX = new RegExp('@Module\\(([\\s\\S]*?)\\)');

  constructor() {}

  public parse(content: string): ModuleMetadata {
    return <ModuleMetadata> JSON.parse(this.METADATA_REGEX.exec(content)[ 1 ].replace(/([a-zA-Z]+)/g, '"$1"'));
  }
}