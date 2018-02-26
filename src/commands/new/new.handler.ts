import * as child_process from 'child_process';
import * as path from 'path';

export interface NewArguments {
  name: string;
}

export class NewHandler {
  constructor() {}

  public async handle(args: NewArguments): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      child_process.exec(
        `${ path.join(__dirname, '../../..', 'node_modules/.bin/schematics') } ${ path.join(__dirname, '../../..') }:application --dry-run=false --path=${ args.name } --extension=ts`,
        (error: Error, stdout: string) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log(stdout);
            resolve();
          }
        });
    });
  }
}