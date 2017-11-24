import { ConfigurationLoader } from '../configuration/configuration.loader';
import * as path from 'path';
import { NodemonAdapter } from './nodemon.adapter';
import { LoggerService } from '../logger/logger.service';
import { Logger } from '../common/logger/interfaces/logger.interface';
import { ColorService } from '../logger/color.service';

export class ServeHandler {
  constructor(private logger: Logger = LoggerService.getLogger()) {}

  public handle() {
    this.logger.debug(ColorService.blue('[DEBUG]'), 'execute serve command');
    const language: string = ConfigurationLoader.getProperty('language');
    const entryFile: string = path.resolve(process.cwd(), ConfigurationLoader.getProperty('entryFile'));
    NodemonAdapter.start(this.buildExecCommand(language, entryFile));
  }

  private buildExecCommand(language: string, entryFile: string) {
    if (language === 'js') {
      return {
        'watch': ['src/**/*.js'],
        'ignore': ['src/**/*.spec.js'],
        'exec': `node ${ entryFile }`
      };
    } else {
      return {
        'watch': ['src/**/*.ts'],
        'ignore': ['src/**/*.spec.ts'],
        'exec': `./node_modules/.bin/ts-node ${ entryFile }`
      };
    }
  }
}
