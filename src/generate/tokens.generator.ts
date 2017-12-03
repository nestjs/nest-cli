import { ClassNameBuilder } from './class-name.builder';
import { Token } from './template.replacer';
import { FileNameBuilder } from './file-name.builder';

export enum TokenName {
  CLASS_NAME = '__CLASS_NAME__',
  SPEC_IMPORT = '__SPEC_IMPORT__'
}

export class TokensGenerator {
  constructor(
    private classNameBuilder = new ClassNameBuilder(),
    private fileNameBuilder = new FileNameBuilder()
  ) {}

  public generateFrom(type: string, name: string): Token[] {
    return [
      this.generateClassNameToken(type, name),
      this.generateSpecImportToken(type, name)
    ];
  }

  private generateClassNameToken(type: string, name: string): Token {
    return {
      name: TokenName.CLASS_NAME,
      value: this.classNameBuilder.buildFrom(type, name)
    };
  }

  private generateSpecImportToken(type: string, name: string): Token {
    return {
      name: TokenName.SPEC_IMPORT,
      value: `./${ this.fileNameBuilder.buildFrom(type, name) }`
    };
  }
}