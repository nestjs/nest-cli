import {Command} from '../../common/interfaces';
import {GenerateCommandHandler} from '../handlers';

export class GenerateCommandDescriptor {
  static declare(command: Command) {
    command
      .alias('g')
      .argument('<asset>', 'The generated asset type')
      .argument('<name>', 'The generated asset name')
      .handler(new GenerateCommandHandler());
  }
}
