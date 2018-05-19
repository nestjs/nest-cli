import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import chalk from 'chalk';
import { messages } from '../ui';

export class AbstractRunner {
  constructor(protected binary: string) {}

  public async run(command: string, collect: boolean = false, cwd: string = process.cwd()): Promise<null | string> {
    const args: string[] = [ command ];
    const options: SpawnOptions = {
      stdio: collect ? 'pipe' : 'inherit',
      shell: true,
      cwd: cwd
    };
    return new Promise<null | string>((resolve, reject) => {
      const child: ChildProcess = spawn(`"${ this.binary }"`, args, options);
      if (collect) {
        child.stdout.on('data', (data) => resolve(data.toString().replace(/\r\n|\n/, '')));
      }
      child.on('close', (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          console.error(chalk.red(messages.RUNNER_EXECUTION_ERROR(`${ this.binary } ${ command }`)));
          reject();
        }
      });
    });
  }
}
