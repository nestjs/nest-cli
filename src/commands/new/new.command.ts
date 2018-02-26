import { NewHandler } from './new.handler';

export class NewCommand {
  constructor(private handler: NewHandler = new NewHandler()) {}

  public declare(program: any) {
    program
      .command('new', 'Create a new Nest application')
      .argument('<name>', 'Nest application name')
      .argument('[destination]', 'Where the Nest application will be created')
      .action(async (args) => {
        await this.handler.handle(args);
      });
  }
}
