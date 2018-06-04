import { Input } from '../commands';

export abstract class AbstractAction {
  public abstract async handle(inputs?: Input[], options?: Input[]): Promise<void>;
}
