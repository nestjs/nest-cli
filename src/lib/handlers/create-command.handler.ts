import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {FileSystemUtils} from '../../core/utils/file-system.utils';
import * as path from 'path';
import {ColorService} from '../../logger/color.service';
import {Logger} from '../../common/logger/interfaces/logger.interface';
import {GitRepository} from '../../core/project/repositories/git.repository';
import {LoggerService} from '../../logger/logger.service';
import {CreateCommandArguments} from '../../common/program/interfaces/command.aguments.interface';
import {CreateCommandOptions} from '../../common/program/interfaces/command.options.interface';

export class CreateCommandHandler implements CommandHandler {
  private static DEFAULT_REPOSITORY: string = 'https://github.com/ThomRick/nest-typescript-starter.git';

  public execute(args: CreateCommandArguments, options: CreateCommandOptions, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    logger.debug(ColorService.blue('[DEBUG]'), 'execute new command');
    logger.debug(ColorService.blue('[DEBUG]'), 'arguments :', JSON.stringify(args, null, 2));
    logger.debug(ColorService.blue('[DEBUG]'), 'options   :', JSON.stringify(options, null, 2));
    const name: string = args.name;
    const destination: string = args.destination || name;
    const repository: string = options.repository || CreateCommandHandler.DEFAULT_REPOSITORY;
    return new GitRepository(repository, destination)
      .clone()
        .then(() => FileSystemUtils.readdir(path.join(process.cwd(), destination)))
        .then(files => files.forEach(file => logger.info(ColorService.green('create'), file)))
  }
}
