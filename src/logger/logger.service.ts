import { ConsoleLogger } from './console.logger';
import { Logger } from './logger.interface';

export class LoggerService {
  private static logger: Logger;

  public static setLogger(logger: Logger) {
    LoggerService.logger = logger;
  }

  public static getLogger(): Logger {
    return (LoggerService.logger === undefined || LoggerService.logger === null) ? new ConsoleLogger() : LoggerService.logger;
  }
}
