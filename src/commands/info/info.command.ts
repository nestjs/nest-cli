import { InfoHandler } from './info.handler';
import { LoggerService } from '../../logger/logger.service';

export class InfoCommand {
  constructor(private handler: InfoHandler = new InfoHandler()) {}

  public declare(program) {
    program
      .command('info', 'Display Nest CLI information.')
      .action(async (args, options, logger) => {
        LoggerService.setLogger(logger);
        await this.handler.handle();
      });
  }
}
