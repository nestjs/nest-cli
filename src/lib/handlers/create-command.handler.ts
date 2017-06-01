import {CommandHandler} from '../../common/interfaces/command.handler.interface';
import {Logger} from '../../common/interfaces/logger.interface';
import {LoggerService} from '../../core/loggers/logger.service';
import {Repository} from '../../common/interfaces/repository.interface';
import {GitRepository} from '../../core/repositories/git.repository';

export class CreateCommandHandler implements CommandHandler {
  public execute(args: any, options: any, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    const name: string = args.name;
    const destination: string = args.destination || name;
    const repository: Repository = new GitRepository('https://github.com/KerryRitter/nest-typescript-starter', destination);
    return repository.clone();
  }
}
