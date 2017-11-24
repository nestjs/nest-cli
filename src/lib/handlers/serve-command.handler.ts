import * as nodemon from 'nodemon';
import * as path from 'path';
import { Logger } from '../../common/logger/interfaces/logger.interface';
import { GenerateCommandArguments } from '../../common/program/interfaces/command.aguments.interface';
import { CommandHandler } from '../../common/program/interfaces/command.handler.interface';
import { GenerateCommandOptions } from '../../common/program/interfaces/command.options.interface';
import { ConfigurationLoader } from '../../configuration/configuration.loader';
import { ColorService } from '../../core/logger/color.service';
import { LoggerService } from '../../core/logger/logger.service';


export class ServeCommandHandler implements CommandHandler {
    public execute(
        args: GenerateCommandArguments,
        options: GenerateCommandOptions,
        logger: Logger
    ): Promise<void> {
        LoggerService.setLogger(logger);
        logger.debug(ColorService.blue('[DEBUG]'), 'execute serve command');
        return ConfigurationLoader.load()
            .then(() => {
                const language: string = ConfigurationLoader.getProperty('language');
                const entryFile: string =
                    path.resolve(process.cwd(),
                        ConfigurationLoader.getProperty('entryFile'));

                if (language == 'js') {
                    nodemon({
                        'watch': ['src/**/*.js'],
                        'ignore': ['src/**/*.spec.js'],
                        'exec': `node ${entryFile}`
                    })
                } else {
                    nodemon({
                        'watch': ['src/**/*.ts'],
                        'ignore': ['src/**/*.spec.ts'],
                        'exec': `./node_modules/.bin/ts-node ${entryFile}`
                    })
                }
            });
    }
}
