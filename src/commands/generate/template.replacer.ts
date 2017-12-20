import { Template } from './template';
import { Token } from './token';

export class TemplateReplacer {
  constructor() {}

  public replace(template: Template, tokens: Token[]): Template {
    return {
      name: template.name,
      content: this.replaceTokens(template.content, tokens)
    };
  }

  private replaceTokens(content: string, tokens: Token[]): string {
    return tokens
      .reduce((currentContent, token) =>
        currentContent.replace(new RegExp(token.name, 'g'), token.value),
        content
      );
  }
}