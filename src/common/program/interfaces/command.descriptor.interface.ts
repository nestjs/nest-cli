import {Command} from './command.interface';

export interface CommandDescriptor {
  describe(command: Command): void
}
