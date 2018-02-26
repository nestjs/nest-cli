import * as path from 'path';
import { GenerateHandler } from './handler';
import { FileSystemUtils } from '../../utils/file-system.utils';
import { LoggerService } from '../../logger/logger.service';

export interface GenerateArguments {
  type: string;
  name: string;
}

export class GenerateCommand {
  constructor() {}

  public async init(program) {
    const assets: string[] = await FileSystemUtils.readdir(path.resolve(__dirname, 'templates'));
    program
      .command('generate', 'Generate a new Nest asset')
      .alias('g')
      .argument('<type>', 'The generated asset type', assets)
      .argument('<name>', 'The generated asset name / path')
      .action(async (args, options, logger) => {
        LoggerService.setLogger(logger);
        return await new GenerateHandler().handle(args);
      });
  }
}
