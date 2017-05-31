import {Command} from '../../common/interfaces/command.interface';
import {GenerateCommandHandler} from '../handlers/generate-command.handler';

export class GenerateCommandDescriptor {
  static declare(command: Command) {
    command
      .alias('g')
      .argument('<asset>', 'The generated asset type')
      .argument('<name>', 'The generated asset name')
      .handler(new GenerateCommandHandler());
  }
}
