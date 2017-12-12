export enum TemplateId {
  MAIN, SPEC
}

export interface Template {
  id?: TemplateId;
  content: string;
}

export interface Token {
  name: string;
  value: string;
}

export class TemplateReplacer {
  constructor() {}

  public replace(template: Template, tokens: Token[]): Template {
    return {
      id: template.id,
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