import {Command} from '../../common/program/interfaces/command.interface';
import {UpdateCommandHandler} from '../handlers/update-command.handler';

export class UpdateCommandDescriptor {
  public static declare(command: Command) {
    command
      .handler(new UpdateCommandHandler());
  }
}
