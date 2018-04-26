import { NewCommand } from './new.command';
import { NewAction, GenerateAction, InfoAction } from '../actions';
import { GenerateCommand } from './generate.command';
import { InfoCommand } from './info.command';

export class CommandLoader {
  public static load(program): void {
    new NewCommand(new NewAction()).load(program);
    new GenerateCommand(new GenerateAction()).load(program);
    new InfoCommand(new InfoAction()).load(program);
  }
}
