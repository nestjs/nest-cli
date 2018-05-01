import { AbstractAction } from '../actions/abstract.action';

export abstract class AbstractCommand {
  constructor(protected action: AbstractAction) {}
  
  public abstract async load(program: any);
}