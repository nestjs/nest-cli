import {Command} from '../../common/program/interfaces/command.interface';
import {CreateCommandHandler} from '../handlers/create-command.handler';
import {CommandDescriptor} from '../../common/program/interfaces/command.descriptor.interface';
import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';

export class CreateCommandDescriptor implements CommandDescriptor {
  constructor(
    private _handler: CommandHandler = new CreateCommandHandler()
  ) {}

  public describe(command: Command): void {
    command
      .argument('<name>', 'Nest application name')
      .argument('[destination]', 'Where the Nest application will be created')
      .option('-r, --repository <repository>', 'Github repository where the project template is')
      .handler(this._handler);
  }
}
