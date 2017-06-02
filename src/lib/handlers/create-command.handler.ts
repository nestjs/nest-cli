import {CommandArguments, CommandOptions, Logger, Repository} from '../../common/interfaces';
import {GitRepository} from '../../core/repositories';
import {AbstractCommandHandler} from './abstract-command.handler';

export interface CreateCommandArguments extends CommandArguments {
  name: string
  destination?: string
}

export interface CreateCommandOptions extends CommandOptions {}

export class CreateCommandHandler extends AbstractCommandHandler {
  public run(args: CreateCommandArguments, options: CreateCommandOptions, logger: Logger): Promise<void> {
    const name: string = args.name;
    const destination: string = args.destination || name;
    const repository: Repository = new GitRepository('https://github.com/KerryRitter/nest-typescript-starter', destination);
    return repository.clone();
  }
}
