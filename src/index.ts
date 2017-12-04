import * as program from 'caporal';
import { ConfigurationLoader } from './configuration/configuration.loader';
import { CreateCommand } from './create/command';
import { InfoCommand } from './info/command';
import { ServeCommand } from './serve/command';
import { ColorService } from './logger/color.service';
import { GenerateCommand } from './generate/command';

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
    await new CreateCommand().init(program);
    await new InfoCommand().init(program);
    await new ServeCommand().init(program);
    await new GenerateCommand().init(program);
    program.parse(process.argv);
  }
}




