import { Input, CommandInputsContainer } from '../commands';

export abstract class AbstractAction {
  public abstract handle(
    inputs?: Input[],
    options?: CommandInputsContainer,
    extraFlags?: string[],
  ): Promise<void>;
}
