import {Logger} from '../../logger/interfaces/logger.interface';
import {CommandArguments} from './command.aguments.interface';
import {CommandOptions} from './command.options.interface';

export interface CommandHandler {
  execute(args: CommandArguments, options: CommandOptions, logger: Logger): Promise<void>;
}
