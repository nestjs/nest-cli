import chalk from 'chalk';
import { spawn } from 'child_process';
import { Input } from '../commands';
import { BuildAction } from './build.action';

export class DevAction extends BuildAction {
  public async handle(inputs: Input[], options: Input[]) {
    let childProcessRef: any;
    try {
      const onSuccess = () => {
        if (childProcessRef) {
          childProcessRef.kill();
        }
        childProcessRef = spawn('node', ['dist/main'], {
          cwd: process.cwd(),
          stdio: 'pipe',
        });
        childProcessRef.stdout.pipe(process.stdout);
      };
      const watchMode = true;
      await this.runBuild(options, watchMode, onSuccess);

      process.on('exit', code => childProcessRef && childProcessRef.kill(code));
    } catch (err) {
      console.error(chalk.red(err));
    }
  }
}
