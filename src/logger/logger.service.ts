import { ConsoleLogger } from './console.logger';

export interface Logger {
  debug(...messages: any[]): void
  error(...messages: any[]): void
  info(...messages: any[]): void
  log(...messages: any[]): void
  warn(...messages: any[]): void
}

export class LoggerService {
  private static logger: Logger;

  public static setLogger(logger: Logger) {
    LoggerService.logger = logger;
  }

  public static getLogger(): Logger {
    return (LoggerService.logger === undefined || LoggerService.logger === null) ? new ConsoleLogger() : LoggerService.logger;
  }
}
