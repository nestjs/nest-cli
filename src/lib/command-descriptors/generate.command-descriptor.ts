import {Command} from '../../common/program/interfaces/command.interface';
import {GenerateCommandHandler} from '../handlers/generate-command.handler';

export class GenerateCommandDescriptor {
  static declare(command: Command) {
    command
      .alias('g')
      .argument('<assetType>', 'The generated asset type')
      .argument('<assetName>', 'The generated asset name')
      .argument('[moduleName]', 'The module name where the asset will be declared in')
      .handler(new GenerateCommandHandler());
  }
}
