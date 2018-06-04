import { CommanderStatic } from 'commander';
import { GenerateAction, InfoAction, NewAction } from '../actions';
import { UpdateAction } from '../actions/update.action';
import { GenerateCommand } from './generate.command';
import { InfoCommand } from './info.command';
import { NewCommand } from './new.command';
import { UpdateCommand } from './update.command';

export class CommandLoader {
  public static load(program: CommanderStatic): void {
    new NewCommand(new NewAction()).load(program);
    new GenerateCommand(new GenerateAction()).load(program);
    new InfoCommand(new InfoAction()).load(program);
    new UpdateCommand(new UpdateAction()).load(program);
  }
}
