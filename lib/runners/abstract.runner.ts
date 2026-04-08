import { red } from 'ansis';
import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import { MESSAGES } from '../ui/index.js';

export class AbstractRunner {
  constructor(
    protected binary: string,
    protected args: string[] = [],
  ) {}

  public async run(
    command: string,
    collect = false,
    cwd: string = process.cwd(),
  ): Promise<null | string> {
    const args: string[] = [command];
    const options: SpawnOptions = {
      cwd,
      stdio: collect ? 'pipe' : 'inherit',
      shell: true,
    };
    return new Promise<null | string>((resolve, reject) => {
      const fullCommand = [this.binary, ...this.args, ...args].join(' ');
      const child: ChildProcess = spawn(fullCommand, options);
      if (collect) {
        const chunks: Buffer[] = [];
        child.stdout!.on('data', (data) => chunks.push(data));
        child.on('close', (code) => {
          if (code === 0) {
            resolve(
              Buffer.concat(chunks)
                .toString()
                .replace(/\r\n|\n/g, ''),
            );
          } else {
            console.error(red(MESSAGES.RUNNER_EXECUTION_ERROR(fullCommand)));
            reject();
          }
        });
      } else {
        child.on('close', (code) => {
          if (code === 0) {
            resolve(null);
          } else {
            console.error(red(MESSAGES.RUNNER_EXECUTION_ERROR(fullCommand)));
            reject();
          }
        });
      }
    });
  }

  /**
   * @param command
   * @returns The entire command that will be ran when calling `run(command)`.
   */
  public rawFullCommand(command: string): string {
    const commandArgs: string[] = [...this.args, command];
    return `${this.binary} ${commandArgs.join(' ')}`;
  }
}
