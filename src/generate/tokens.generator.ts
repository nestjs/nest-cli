import { ClassNameBuilder } from './class-name.builder';
import { Token } from './template.replacer';

export enum TokenName {
  CLASS_NAME = '__CLASS_NAME__'
}

export class TokensGenerator {
  constructor(private classNameBuilder = new ClassNameBuilder()) {
  }

  public generateFrom(type: string, name: string): Token[] {
    return [
      this.generateClassNameToken(type, name)
    ];
  }

  private generateClassNameToken(type: string, name: string): Token {
    return {
      name: TokenName.CLASS_NAME,
      value: this.classNameBuilder.buildFrom(type, name)
    };
  }
}