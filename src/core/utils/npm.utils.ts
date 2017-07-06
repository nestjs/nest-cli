import {ChildProcess, spawn} from 'child_process';

export class NpmUtils {
  public static update(dependencies: string[] = []): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const spawned: ChildProcess = spawn('npm', [ 'update', '--save', ...dependencies ]);
      spawned.on('exit', code => {
        if (code === 1)
          reject();
        else
          resolve();
      });
    });
  }

  public static uninstall(dependencies: string[] = []): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const spawned: ChildProcess = spawn('npm', [ 'uninstall', '--save', ...dependencies ]);
      spawned.on('exit', code => {
        if (code === 1)
          reject();
        else
          resolve();
      });
    });
  }
}
