import {ChildProcess, spawn} from 'child_process';

export class NpmUtils {
  public static update(dependencies: string[] = []): Promise<void> {
    const spawned: ChildProcess = spawn('npm', [ 'update', '--save', ...dependencies ]);
    return this.handle(spawned);
  }

  public static uninstall(dependencies: string[] = []): Promise<void> {
    const spawned: ChildProcess = spawn('npm', [ 'uninstall', '--save', ...dependencies ]);
    return this.handle(spawned);
  }

  public static install(dependencies: string[] = []): Promise<void> {
    const spawned: ChildProcess = spawn('npm', [ 'install', '--save', ...dependencies ]);
    return this.handle(spawned);
  }

  private static handle(spawned: ChildProcess): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      spawned.on('exit', code => {
        if (code === 1)
          reject();
        else
          resolve();
      });
    });
  }
}
