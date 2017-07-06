import {ChildProcess, spawn} from 'child_process';

export class NpmUtils {
  public static update(dev: string = '', dependencies: string[] = []): Promise<void> {
    const spawned: ChildProcess = spawn('npm', [ 'update', '--save'.concat(dev), ...dependencies ]);
    return this.handle(spawned);
  }

  public static uninstall(dev: string = '', dependencies: string[] = []): Promise<void> {
    const spawned: ChildProcess = spawn('npm', [ 'uninstall', '--save'.concat(dev), ...dependencies ]);
    return this.handle(spawned);
  }

  public static install(dev: string = '', dependencies: string[] = []): Promise<void> {
    const spawned: ChildProcess = spawn('npm', [ 'install', '--save'.concat(dev), ...dependencies ]);
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
