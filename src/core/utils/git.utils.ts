import {exec} from 'child_process';

export class GitUtils {
  public static clone(remote, destination): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      exec(`git clone ${ remote } ${ destination }`, (error, stdout, sdterr) => {
        if (error) {
          reject(error)
        }
        else {
          resolve();
        }
      });
    });
  }
}
