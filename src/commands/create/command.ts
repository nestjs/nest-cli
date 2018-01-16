import { CreateHandler } from './handler';
import { LoggerService } from '../../logger/logger.service';

export interface CreateArguments {
  name: string;
  destination?: string;
}

export interface CreateOptions {
  repository: string;
}

export class CreateCommand {
  constructor() {}

  public async init(program) {
    program
      .command('new', 'Create a new Nest application')
      .argument('<name>', 'Nest application name')
      .argument('[destination]', 'Where the Nest application will be created')
      .option('-r, --repository <repository>', 'Github repository where the project template is')
      .action(async (args, options, logger) => {
        LoggerService.setLogger(logger);
        await new CreateHandler().handle(args, options);
      });
  }
}
