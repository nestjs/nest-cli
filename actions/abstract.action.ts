import { CommandStorage } from '../commands';

export abstract class AbstractAction {
  public abstract handle(
    inputs?: CommandStorage,
    options?: CommandStorage,
    extraFlags?: string[],
  ): Promise<void>;
}
