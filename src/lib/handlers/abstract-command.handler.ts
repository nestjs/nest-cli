import {CommandArguments, CommandHandler, CommandOptions, Logger} from '../../common/interfaces';
import {LoggerService} from '../../core/loggers/logger.service';

export abstract class AbstractCommandHandler implements CommandHandler {
  public execute(args: CommandArguments, options: CommandOptions, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    return this.run(args, options, logger);
  }

  public abstract run(args: CommandArguments, options: CommandOptions, logger: Logger): Promise<void>;

}
