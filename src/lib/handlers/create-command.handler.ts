import {CommandArguments, CommandOptions, Logger, Repository} from '../../common/interfaces';
import {GitRepository} from '../../core/project/repositories';
import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {FileSystemUtils} from '../../core/utils/file-system.utils';
import * as path from 'path';
import {ColorService} from '../../core/logger/color.service';

export interface CreateCommandArguments extends CommandArguments {
  name: string
  destination?: string
}

export interface CreateCommandOptions extends CommandOptions {}

export class CreateCommandHandler implements CommandHandler {
  private static DEFAULT_REPOSITORY: string = 'https://github.com/ThomRick/nest-typescript-starter.git';

  public execute(args: CreateCommandArguments, options: CreateCommandOptions, logger: Logger): Promise<void> {
    const name: string = args.name;
    const destination: string = args.destination || name;
    const repository: Repository = new GitRepository(CreateCommandHandler.DEFAULT_REPOSITORY, destination);
    return repository.clone()
      .then(() => FileSystemUtils.readdir(path.join(process.cwd(), destination)))
      .then(files => files.forEach(file => logger.info(ColorService.green('create'), file)))

  }
}
