import {CommandHandler} from '../../common/program/interfaces/command.handler.interface';
import {Logger} from '../../common/logger/interfaces/logger.interface';
import {UpdateCommandArguments} from '../../common/program/interfaces/command.aguments.interface';
import {UpdateCommandOptions} from '../../common/program/interfaces/command.options.interface';
import {LoggerService} from '../../core/logger/logger.service';
import {ColorService} from '../../core/logger/color.service';
import {Processor} from '../../common/asset/interfaces/processor.interface';
import {UpdateProcessor} from '../../core/update/processors/update.processor';

export class UpdateCommandHandler implements CommandHandler {
  public execute(args: UpdateCommandArguments, options: UpdateCommandOptions, logger: Logger): Promise<void> {
    LoggerService.setLogger(logger);
    logger.debug(ColorService.blue('[DEBUG]'), 'execute update command');
    logger.debug(ColorService.blue('[DEBUG]'), 'arguments :', JSON.stringify(args, null, 2));
    logger.debug(ColorService.blue('[DEBUG]'), 'options   :', JSON.stringify(options, null, 2));
    return new UpdateProcessor().processV2(args, options);
  }

}
