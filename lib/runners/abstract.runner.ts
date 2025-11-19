import { red } from 'ansis';
import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import { platform } from 'os';
import { MESSAGES } from '../ui';

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
    const commandArgs = command.split(' ');
    const isWindows = platform() === 'win32';
    const options: SpawnOptions = {
      cwd,
      stdio: collect ? 'pipe' : 'inherit',
      shell: isWindows,
    };
    return new Promise<null | string>((resolve, reject) => {
      const child: ChildProcess = spawn(
        this.binary,
        [...this.args, ...commandArgs],
        options,
      );
      if (collect) {
        child.stdout!.on('data', (data) =>
          resolve(data.toString().replace(/\r\n|\n/, '')),
        );
      }
      child.on('close', (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          console.error(
            red(
              MESSAGES.RUNNER_EXECUTION_ERROR(`${this.binary} ${command}`),
            ),
          );
          reject();
        }
      });
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
