import * as child_process from 'child_process';

export interface NewArguments {
  name: string;
}

export class NewHandler {
  constructor() {}

  public async handle(args: NewArguments): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      child_process.exec(
        `npm run -s schematics -- .:application --path=${ args.name } --extension=ts`,
        (error: Error, stdout: string, stderr: string) => {
          resolve();
        });
    });
  }
}