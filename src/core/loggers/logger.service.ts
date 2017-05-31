import {Logger} from '../../common/interfaces/logger.interface';
import {isNullOrUndefined} from 'util';

export class LoggerService {
  private static logger: Logger;

  public static setLogger(logger: Logger) {
    LoggerService.logger = logger;
  }

  public static getLogger(): Logger {
    return isNullOrUndefined(LoggerService.logger) ? console : LoggerService.logger;
  }
}
