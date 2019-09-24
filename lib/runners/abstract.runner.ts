import chalk from 'chalk';
import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import { MESSAGES } from '../ui';

export class AbstractRunner {
  constructor(protected binary: string) {}

  public async run(
    command: string,
    collect: boolean = false,
    cwd: string = process.cwd(),
  ): Promise<null | string> {
    const args: string[] = [command];
    const options: SpawnOptions = {
      cwd,
      stdio: collect ? 'pipe' : 'inherit',
      shell: true,
    };
    return new Promise<null | string>((resolve, reject) => {
      const child: ChildProcess = spawn(`${this.binary}`, args, options);
      if (collect) {
        child.stdout!.on('data', data =>
          resolve(data.toString().replace(/\r\n|\n/, '')),
        );
      }
      child.on('close', code => {
        if (code === 0) {
          resolve(null);
        } else {
          console.error(
            chalk.red(
              MESSAGES.RUNNER_EXECUTION_ERROR(`${this.binary} ${command}`),
            ),
          );
          reject();
        }
      });
    });
  }
}
