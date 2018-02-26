import * as program from 'caporal';
import { InfoCommand } from './commands/info/info.command';
import { ServeCommand } from './commands/serve/serve.command';
import { GenerateCommand } from './commands/generate/generate.command';
import { NewCommand } from './commands/new/new.command';

export class NestCliApplication {
  constructor() {}

  public static async start(version) {
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
