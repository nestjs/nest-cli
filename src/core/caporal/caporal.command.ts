import {Command} from '../../common/interfaces/command.interface';

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

  public handler(): Command {
    this.command.action((args: any, options: any, logger: any) => {
      console.log('command action');
    });
    return this;
  }

}
