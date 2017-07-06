import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {Logger} from '../../common/logger/interfaces/logger.interface';
import {UpdateCommandArguments} from '../../common/program/interfaces/command.aguments.interface';
import {UpdateCommandOptions} from '../../common/program/interfaces/command.options.interface';

export class UpdateCommandHandler implements CommandHandler {
  public execute(args: UpdateCommandArguments, options: UpdateCommandOptions, logger: Logger): Promise<void> {
    return undefined;
  }

}
