import * as program from 'caporal';
import { ConfigurationLoader } from './configuration/configuration.loader';
import { ColorService } from './logger/color.service';
import { InfoCommand } from './commands/info/info.command';
import { ServeCommand } from './commands/serve/serve.command';
import { GenerateCommand } from './commands/generate/generate.command';
import { NewCommand } from './commands/new/new.command';

export class NestCliApplication {
  constructor() {}

  public static async start(version) {
    await this.loadConfiguration();
    await this.run(version);
  }

  private static async loadConfiguration() {
    try {
      await ConfigurationLoader.load();
    } catch (error) {
      process.stderr.write(`${ ColorService.yellow('[ WARN ]') } - Can\'t execute generate and serve commands until the project is not initialized\n`);
    }
  }

  private static async run(version) {
    program
      .version(version)
      .help('Nest.js CLI');
    new NewCommand().declare(program);
    new GenerateCommand().declare(program);
    new InfoCommand().declare(program);
    new ServeCommand().declare(program);
    program.parse(process.argv);
  }
}




