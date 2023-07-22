import { Input, CommandStorage } from '../commands';

export abstract class AbstractAction {
  public abstract handle(
    inputs?: Input[],
    options?: CommandStorage,
    extraFlags?: string[],
  ): Promise<void>;
}
