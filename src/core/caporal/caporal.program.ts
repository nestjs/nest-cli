import {Program} from '../../common/interfaces/program.interface';
import * as caporal from 'caporal';
import {Command} from '../../common/interfaces/command.interface';
import {CaporalCommand} from './caporal.command';

export class CaporalProgram implements Program {
  constructor(private program = caporal) {}

  public version(version: string): Program {
    this.program.version(version);
    return this;
  }

  public help(content: string): Program {
    this.program.help(content);
    return this;
  }

  public command(name: string, description: string): Command {
    return new CaporalCommand(this.program.command(name, description));
  }

  public listen(): void {
    this.program.parse(process.argv);
  }

}
