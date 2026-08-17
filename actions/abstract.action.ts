export abstract class AbstractAction {
  public abstract handle(context?: any): Promise<void>;
}
