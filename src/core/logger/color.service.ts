export class ColorService {
  private static RESET: string = '\x1b[0m';

  public static white(message: string): string {
    return `\x1b[37m${ message }${ this.RESET }`;
  }

  public static green(message: string): string {
    return `\x1b[32m${ message }${ this.RESET }`;
  }

  public static yellow(message: string): string {
    return `\x1b[33m${ message }${ this.RESET }`;
  }

  public static red(message: string): string {
    return `\x1b[31m${ message }${ this.RESET }`;
  }

  public static blue(message: string): string {
    return `\x1b[34m${ message }${ this.RESET }`
  }
}
