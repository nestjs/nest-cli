import { CommanderStatic } from 'commander';
import { AbstractAction } from '../actions/abstract.action';

export abstract class AbstractCommand {
  constructor(protected action: AbstractAction) {}

  public abstract load(program: CommanderStatic): void;
}
