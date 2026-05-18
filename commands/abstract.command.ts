import { Command } from 'commander';
import { AbstractAction } from '../actions/abstract.action.js';

export abstract class AbstractCommand {
  constructor(protected action: AbstractAction) {}

  public abstract load(program: Command): void;
}
