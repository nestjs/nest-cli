import { ServeHandler } from './handler';
import { LoggerService } from '../../logger/logger.service';

export class ServeCommand {
  constructor() {}

  public async init(program) {
    program
      .command('serve', 'Start a hot reload development server.')
      .action((args, options, logger) => {
        LoggerService.setLogger(logger);
        return new ServeHandler().handle();
      });
  }
};
