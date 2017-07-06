import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {Logger} from '../../common/logger/interfaces/logger.interface';

export class UpdateCommandHandler implements CommandHandler {
  public execute(args: any, options: any, logger: Logger): Promise<void> {
    return undefined;
  }

}
