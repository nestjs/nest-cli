import {Logger} from '../../common/logger/interfaces/logger.interface';
import {isNullOrUndefined} from 'util';
import {ConsoleLogger} from './console.logger';

export class LoggerService {
  private static logger: Logger;

  public static setLogger(logger: Logger) {
    LoggerService.logger = logger;
  }

  public static getLogger(): Logger {
    return isNullOrUndefined(LoggerService.logger) ? new ConsoleLogger() : LoggerService.logger;
  }
}
