import {CommandHandler} from '../../common/interfaces/command.handler.interface';
import {Logger} from '../../common/interfaces/logger.interface';

export class CreateCommandHandler implements CommandHandler {
  public execute(args: any, options: any, logger: Logger): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
