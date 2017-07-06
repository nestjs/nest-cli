import {Command} from '../../common/program/interfaces/command.interface';
import {CreateCommandHandler} from '../handlers/create-command.handler';
import {CommandDescriptor} from '../../common/program/interfaces/command.descriptor.interface';

export class CreateCommandDescriptor implements CommandDescriptor {
  public describe(command: Command): void {
    command
      .argument('<name>', 'Nest application name')
      .argument('[destination]', 'Where the Nest application will be created')
      .option('-r, --repository <repository>', 'Github repository where the project template is')
      .handler(new CreateCommandHandler());
  }
}
