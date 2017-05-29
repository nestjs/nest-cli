import {CommandHandler} from '../../common/interfaces/command.handler.interface';

export class CreateCommandHandler implements CommandHandler {
  public execute(args: any, options: any, logger: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
