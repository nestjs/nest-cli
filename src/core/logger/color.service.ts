export class ColorService {

  public static white(message: string): string {
    return `\x1b[37m${ message }\x1b[0m`;
  }

  public static green(message: string): string {
    return `\x1b[32m${ message }\x1b[0m`;
  }

  public static yellow(message: string): string {
    return `\x1b[33m${ message }\x1b[0m`;
  }

  public static red(message: string): string {
    return `\x1b[31m${ message }\x1b[0m`;
  }
}
