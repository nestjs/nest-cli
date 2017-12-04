import { InfoHandler } from './handler';
import { LoggerService } from '../../logger/logger.service';

export class InfoCommand {
  constructor() {}

  public async init(program) {
    program
      .command('info', 'Display Nest CLI information.')
      .action(async (args, options, logger) => {
        LoggerService.setLogger(logger);
        return await new InfoHandler().handle();
      });
  }
}
