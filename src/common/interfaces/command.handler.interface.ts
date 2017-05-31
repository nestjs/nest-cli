import {Logger} from './logger.interface';

export interface CommandHandler {
  execute(args: any, options: any, logger: Logger): Promise<void>;
}
