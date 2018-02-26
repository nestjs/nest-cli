import * as child_process from 'child_process';
import * as path from 'path';

export interface GenerateArguments {
  type: string;
  name: string;
}

export class GenerateHandler {
  constructor() {}

  public async handle(args: GenerateArguments): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      child_process.exec(
        path.join(__dirname, '../../..', 'node_modules/.bin/schematics')
          .concat(` ${ path.join(__dirname, '../../..') }:${ args.type }`)
          .concat(` --dry-run=false`)
          .concat(` --extension=ts`)
          .concat(` --name=${ args.name }`)
          .concat(` --path=${ args.name }`)
          .concat(' --rootDir=src/modules'),
        (error: Error, stdout: string) => {
          if (error) {
            reject(error);
          } else {
            console.log(stdout);
            resolve();
          }
        });
    });
  }
}