import {CommandHandler} from '../../common/interfaces/command.handler.interface';
import {Logger} from '../../common/interfaces/logger.interface';
import {LoggerService} from '../../core/loggers/logger.service';

export class CreateCommandHandler implements CommandHandler {
  public execute(args: any, options: any, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    return Promise.resolve();
  }
}
