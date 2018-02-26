import { ServeHandler } from './serve.handler';
import { LoggerService } from '../../logger/logger.service';

export class ServeCommand {
  constructor(private handler: ServeHandler = new ServeHandler()) {}

  public declare(program) {
    program
      .command('serve', 'Start a hot reload development server.')
      .action((args, options, logger) => {
        LoggerService.setLogger(logger);
        return this.handler.handle();
      });
  }
}
