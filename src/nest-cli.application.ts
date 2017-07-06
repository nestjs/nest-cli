import {CreateCommandDescriptor} from './lib/command-descriptors/create.command-descriptor';
import {GenerateCommandDescriptor} from './lib/command-descriptors/generate.command-descriptor';
import {UpdateCommandDescriptor} from './lib/command-descriptors/update.command-descriptor';
import {CaporalProgram} from './core/program/caporal/caporal.program';

export class NestCliApplication {
  public static run() {
    new CaporalProgram()
      .version('1.0.0')
      .help('Nest.js CLI')
      .declare(program => {
        CreateCommandDescriptor.declare(program.command('new', 'Create a new Nest application'));
        GenerateCommandDescriptor.declare(program.command('generate', 'Generate a new Nest asset'));
        UpdateCommandDescriptor.declare(program.command('update', 'Update the Nest project'));
      })
      .listen();
  }
}