import { InfoHandler } from './info.handler';
import { LoggerService } from '../../logger/logger.service';

export class InfoCommand {
  constructor() {}

  public declare(program) {
    program
      .command('info', 'Display Nest CLI information.')
      .action(async (args, options, logger) => {
        LoggerService.setLogger(logger);
        await new InfoHandler().handle();
      });
  }
}
