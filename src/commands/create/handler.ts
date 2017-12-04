import { GitRepository} from './git.repository';
import { CreateArguments, CreateOptions } from './command';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';
import { ConfigurationEmitter } from './configuration.emitter';

export class CreateHandler {
  private DEFAULT_REMOTE = 'https://github.com/nestjs/typescript-starter.git';

  constructor(
    private logger: Logger = LoggerService.getLogger(),
    private repository: GitRepository = new GitRepository(),
    private configurationEmitter: ConfigurationEmitter = new ConfigurationEmitter()
  ) {}

  public async handle(args: CreateArguments, options?: CreateOptions) {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'execute new command');
    this.logger.debug(ColorService.blue('[DEBUG]'), 'arguments :', JSON.stringify(args, null, 2));
    this.logger.debug(ColorService.blue('[DEBUG]'), 'options   :', JSON.stringify(options, null, 2));
    await this.repository.clone(this.computeRepository(options), args.name);
    await this.configurationEmitter.emit(args.name);
  }

  private computeRepository(options: CreateOptions): string {
    if ((options !== undefined && options !== null) && (options.repository !== undefined && options.repository !== null)) {
      return options.repository;
    } else {
      return this.DEFAULT_REMOTE;
    }
  }
}
