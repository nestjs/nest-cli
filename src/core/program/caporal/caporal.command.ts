import {Command} from '../../../common/program/interfaces/command.interface';
import {CommandHandler} from '../../../common/program/interfaces/command.handler.interface';

export class CaporalCommand implements Command {
  constructor(
    private _command
  ) {}

  public alias(name: string): Command {
    this._command.alias(name);
    return this;
  }

  public argument(name: string, description: string): Command {
    this._command.argument(name, description);
    return this;
  }

  public option(name: string, description: string): Command {
    this._command.option(name, description);
    return this;
  }

  public handler(handler: CommandHandler): Command {
    this._command.action(handler.execute.bind(handler));
    return this;
  }

}
