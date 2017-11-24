import { InfoHandler } from './handler';
import { LoggerService } from '../core/logger/logger.service';

module.exports = (program) => {
  program
    .command('serve', 'Run a live-reloading development server.')
    .action(async (args, options, logger) => {
      LoggerService.setLogger(logger);
      return await new InfoHandler().handle();
    });
};
