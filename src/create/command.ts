import { LoggerService } from '../logger/logger.service';
import { CreateHandler } from './handler';

module.exports = (program) => {
  program
    .command('new', 'Create a new Nest application')
    .argument('<name>', 'Nest application name')
    .argument('[destination]', 'Where the Nest application will be created')
    .option('-r, --repository <repository>', 'Github repository where the project template is')
    .action(async (args, options, logger) => {
      LoggerService.setLogger(logger);
      await new CreateHandler().handle(args, options);
    });
};