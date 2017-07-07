import {CommandArguments} from '../../program/interfaces/command.aguments.interface';
import {CommandOptions} from '../../program/interfaces/command.options.interface';

export interface Processor {
  process(): Promise<void>
  processV2(args: CommandArguments, options: CommandOptions): Promise<void>
}
