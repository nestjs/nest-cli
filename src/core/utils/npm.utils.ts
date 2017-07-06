import {ChildProcess, spawn} from 'child_process';

export class NpmUtils {
  public static update(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const spawned: ChildProcess = spawn('npm', [ 'update', '--save' ]);
      spawned.on('exit', code => {
        if (code === 1)
          reject();
        else
          resolve();
      });
    });
  }
}
