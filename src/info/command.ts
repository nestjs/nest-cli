import { InfoHandler } from './handler';
import { LoggerService } from '../logger/logger.service';

module.exports = (program) => {
  program
    .command('info', 'Display Nest CLI information.')
    .action(async (args, options, logger) => {
      LoggerService.setLogger(logger);
      return await new InfoHandler().handle();
    });
};
