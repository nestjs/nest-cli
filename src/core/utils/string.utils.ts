import * as path from 'path';
import * as os from 'os';

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
    if (this.isDashSeparator(expression))
      return '-';
    else if (this.isPathSeparator(expression))
      return os.platform() === 'win32' ? path.win32.sep : path.posix.sep;
  }

  private static isDashSeparator(expression: string): boolean {
    return new RegExp('-').test(expression);
  }

  private static isPathSeparator(expression: string): boolean {
    if (os.platform() === 'win32')
      return new RegExp('\\'.concat(path.win32.sep)).test(expression);
    else
      return new RegExp(path.posix.sep).test(expression);
  }
}
