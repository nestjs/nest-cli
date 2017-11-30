import { FileSystemUtils } from '../core/utils/file-system.utils';
import * as path from 'path';

export class GenerateCommand {
  constructor() {}

  public async init(program) {
    const assets: string[] = await FileSystemUtils.readdir(path.resolve(__dirname, 'templates'));
    program
      .command('generate', 'Generate a new Nest asset')
      .alias('g')
      .argument('<type>', 'The generated asset type', assets)
      .argument('<name>', 'The generated asset name / path')
      .action((args, options, logger) => {
        logger.info('Inside generate command handler');
      });
  }
}
