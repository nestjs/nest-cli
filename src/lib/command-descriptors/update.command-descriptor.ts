import {CommandDescriptor} from '../../common/program/interfaces/command.descriptor.interface';
import {Command} from '../../common/program/interfaces/command.interface';
import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {UpdateCommandHandler} from '../handlers/update-command.handler';

export class UpdateCommandDescriptor implements CommandDescriptor {
  constructor(
    private _handler: CommandHandler = new UpdateCommandHandler()
  ) {}

  public describe(command: Command): void {
    command
      .handler(this._handler);
  }

}
