import {CommandHandler, Logger, Repository} from '../../common/interfaces';
import {LoggerService} from '../../core/loggers';
import {GitRepository} from '../../core/repositories';

export class CreateCommandHandler implements CommandHandler {
  public execute(args: any, options: any, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    const name: string = args.name;
    const destination: string = args.destination || name;
    const repository: Repository = new GitRepository('https://github.com/KerryRitter/nest-typescript-starter', destination);
    return repository.clone();
  }
}
