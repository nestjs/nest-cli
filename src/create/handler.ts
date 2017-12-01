import { LoggerService } from '../logger/logger.service';
import { Logger } from '../common/logger/interfaces/logger.interface';
import { ColorService } from '../logger/color.service';
import { GitRepository } from './git.repository';
import { CreateArguments, CreateOptions } from './command';

export class CreateHandler {
  private DEFAULT_REMOTE = 'https://github.com/nestjs/typescript-starter.git';

  constructor(private logger: Logger = LoggerService.getLogger()) {}

  public async handle(args: CreateArguments, options?: CreateOptions) {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'execute new command');
    this.logger.debug(ColorService.blue('[DEBUG]'), 'arguments :', JSON.stringify(args, null, 2));
    this.logger.debug(ColorService.blue('[DEBUG]'), 'options   :', JSON.stringify(options, null, 2));
    await new GitRepository().clone(this.computeRepository(options), args.name);
  }

  private computeRepository(options: CreateOptions): string {
    if ((options !== undefined && options !== null) && (options.repository !== undefined && options.repository !== null)) {
      return options.repository;
    } else {
      return this.DEFAULT_REMOTE;
    }
  }
}
