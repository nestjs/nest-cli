import { LoggerService } from '../core/logger/logger.service';
import { ServeHandler } from './handler';

module.exports = (program) => {
  program
    .command('info', 'Get system and environment information.')
    .action((args, options, logger) => {
      LoggerService.setLogger(logger);
      return new ServeHandler().handle();
    });
};
