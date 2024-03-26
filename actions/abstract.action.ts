import { CommandContext } from '../commands';

export abstract class AbstractAction {
  public abstract handle(
    inputs?: CommandContext,
    options?: CommandContext,
    extraFlags?: string[],
  ): Promise<void>;
}
