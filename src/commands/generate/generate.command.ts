import { GenerateHandler } from './generate.handler';

export class GenerateCommand {
  constructor(private handler: GenerateHandler = new GenerateHandler()) {}

  public declare(program: any) {
    program.command('generate', 'Generate a new Nest architecture component')
      .alias('g')
      .argument('<type>', 'The generated component type')
      .argument('<name>', 'The generated component name')
      .action(async (args) => {
        await this.handler.handle(args);
      });
  }
}
