import { ClassNameGenerator } from './class-name.generator';
import { Token } from './template.replacer';
import { FileNameGenerator } from './file-name.generator';

export enum TokenName {
  CLASS_NAME = '__CLASS_NAME__',
  SPEC_IMPORT = '__SPEC_IMPORT__'
}

export class TokensGenerator {
  constructor(
    private classNameBuilder = new ClassNameGenerator(),
    private fileNameBuilder = new FileNameGenerator()
  ) {}

  public generate(type: string, name: string): Token[] {
    return [
      this.generateClassNameToken(type, name),
      this.generateSpecImportToken(type, name)
    ];
  }

  private generateClassNameToken(type: string, name: string): Token {
    return {
      name: TokenName.CLASS_NAME,
      value: this.classNameBuilder.generate(type, name)
    };
  }

  private generateSpecImportToken(type: string, name: string): Token {
    return {
      name: TokenName.SPEC_IMPORT,
      value: `./${ this.fileNameBuilder.generate(type, name) }`
    };
  }
}