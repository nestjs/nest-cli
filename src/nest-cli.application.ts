import {CaporalProgram} from './core/program/caporal';
import {CreateCommandDescriptor, GenerateCommandDescriptor} from './lib/command-descriptors';
import {ConfigurationService} from './core/configuration/services/configuration.service';

export class NestCliApplication {
  public static run() {
    ConfigurationService.load()
      .then(() => {
        new CaporalProgram()
          .version('1.0.0')
          .help('Nest.js CLI')
          .declare(program => {
            CreateCommandDescriptor.declare(program.command('new', 'Create a new Nest application'));
            GenerateCommandDescriptor.declare(program.command('generate', 'Generate a new Nest asset'));
          })
          .listen();
      });
  }
}