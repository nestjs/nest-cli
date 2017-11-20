import { CaporalProgram } from './core/program/caporal/caporal.program';
import { CreateCommandDescriptor } from './lib/command-descriptors/create.command-descriptor';
import { GenerateCommandDescriptor } from './lib/command-descriptors/generate.command-descriptor';
import { InfoCommandDescriptor } from './lib/command-descriptors/info.command-descriptor';
import { ServeCommandDescriptor } from './lib/command-descriptors/serve.command-descriptor';
import { UpdateCommandDescriptor } from './lib/command-descriptors/update.command-descriptor';


export class NestCliApplication {
  public static run(version: string) {
    new CaporalProgram()
      .version(version)
      .help('Nest.js CLI')
      .declare(program => {
        new CreateCommandDescriptor().describe(program.command('new', 'Create a new Nest application'));
        new GenerateCommandDescriptor().describe(program.command('generate', 'Generate a new Nest asset'));
        new UpdateCommandDescriptor().describe(program.command('update', 'Update the Nest project'));
        new ServeCommandDescriptor().describe(program.command('serve', 'Run a live-reloading development server.'));
        new InfoCommandDescriptor().describe(program.command('info', 'Get system and environment information.'));
      })
      .listen();
  }
}
