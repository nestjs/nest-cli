import { LoggerService } from '../logger/logger.service';
import { ServeHandler } from './handler';

export class ServeCommand {
  constructor() {}

  public init(program) {
    program
      .command('serve', 'Start a hot reload development server.')
      .action((args, options, logger) => {
        LoggerService.setLogger(logger);
        return new ServeHandler().handle();
      });
  }
};
