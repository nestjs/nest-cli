import {Command} from '../../common/interfaces/command.interface';

export class GenerateCommandDescriptor {
  static declare(command: Command) {
    command
      .alias('g')
      .argument('<asset>', 'The generated asset type')
      .argument('<name>', 'The generated asset name')
      .argument('[destination]', 'The generated asset root relative path')
      .handler();
  }
}
