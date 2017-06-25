import * as path from 'path';

export class StringUtils {
  public static capitalize(expression: string): string {
    const separator: string = this.computeSeparator(expression);
    return this.capitalizeWord(expression.split(separator).reduce((previous, current) => {
      return previous.concat(this.capitalizeWord(current));
    }));
  }

  private static capitalizeWord(word: string): string {
    return `${ word.charAt(0).toUpperCase() }${ word.slice(1, word.length) }`;
  }

  private static computeSeparator(expression: string): string {
    if (new RegExp('-').test(expression))
      return '-';
    else if (new RegExp(path.sep).test(expression))
      return path.sep;
  }
}
