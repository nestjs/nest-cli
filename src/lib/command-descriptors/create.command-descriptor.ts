import {Command} from '../../common';
import {CreateCommandHandler} from '../handlers';

export class CreateCommandDescriptor {
  public static declare(command: Command): void {
    command
      .argument('<name>', 'Nest application name')
      .argument('[destination]', 'Where the Nest application will be created')
      .option('-r, --repository <repository>', 'Github repository where the project template is')
      .handler(new CreateCommandHandler());
  }
}
