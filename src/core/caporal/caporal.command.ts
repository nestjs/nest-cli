import {Command} from '../../common/interfaces/command.interface';
import {CommandHandler} from '../../common/interfaces/command.handler.interface';

export class CaporalCommand implements Command {
  constructor(private command) {}

  public alias(name: string): Command {
    this.command.alias(name);
    return this;
  }

  public argument(name: string, description: string): Command {
    this.command.argument(name, description);
    return this;
  }

  public option(name: string, description: string): Command {
    this.command.option(name, description);
    return this;
  }

  public handler(handler: CommandHandler): Command {
    this.command.action(handler.execute);
    return this;
  }

}
