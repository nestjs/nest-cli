import { spawn } from 'child_process';
import chalk from 'chalk';
import { messages } from '../ui';

export class AbstractRunner {
  constructor(protected logger, protected binary) {}

  public run(command, collect = false, cwd = process.cwd()) {
    const args = [ command ];
    const options = {
      stdio: collect ? 'pipe' : 'inherit',
      shell: true,
      cwd: cwd
    };
    return new Promise((resolve, reject) => {
      const child = spawn(this.binary, args, options);
      if (collect) {
        child.stdout.on('data', (data) => resolve(data.toString().replace(/\r\n|\n/, '')));
      }
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          this.logger.error(chalk.red(messages.RUNNER_EXECUTION_ERROR(command)));
          reject();
        }
      });
    });
  }
}
