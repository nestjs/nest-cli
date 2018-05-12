import { NewCommand } from './new.command';
import { NewAction, GenerateAction, InfoAction } from '../actions';
import { GenerateCommand } from './generate.command';
import { InfoCommand } from './info.command';
import { UpdateCommand } from './update.command';
import { UpdateAction } from '../actions/update.action';
import { CommanderStatic } from 'commander';

export class CommandLoader {
  public static load(program: CommanderStatic): void {
    // new NewCommand(new NewAction()).load(program);
    // new GenerateCommand(new GenerateAction()).load(program);
    new InfoCommand(new InfoAction()).load(program);
    // new UpdateCommand(new UpdateAction()).load(program);
  }
}
