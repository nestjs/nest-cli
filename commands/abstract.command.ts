import { CommanderStatic } from 'commander';
import { AbstractAction } from '../actions/abstract.action';

export abstract class AbstractCommand<T extends AbstractAction> {
  constructor(protected action: T) {}

  public abstract load(program: CommanderStatic): void;
}
