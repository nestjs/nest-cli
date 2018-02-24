import { exec } from 'child_process';

export class NewCommand {
  constructor() {}

  public init(program: any) {
    program
      .command('new', 'Create a new Nest application')
      .argument('<name>', 'Nest application name')
      .argument('[destination]', 'Where the Nest application will be created')
      .action((args, options, logger) => {
        exec('npm run -s schematics -- .:application --extension=ts --path=app', (error: Error, stdout: string, stderr: string) => {
          if (error) {
            console.error(error);
          } else {
            console.log(stdout);
          }
        });
      });
  }
}
