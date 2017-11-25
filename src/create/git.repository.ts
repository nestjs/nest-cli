import { exec } from 'child_process';
import { Logger } from '../common/logger/interfaces/logger.interface';
import { LoggerService } from '../logger/logger.service';
import { ColorService } from '../logger/color.service';
import { FileSystemUtils } from '../core/utils/file-system.utils';
import * as path from 'path';

export class GitRepository {
  constructor(private remote: string, private local: string, private logger: Logger = LoggerService.getLogger()) {}

  public async clone(): Promise<void> {
    await this.gitClone();
    await this.removeGitFolder();
    await this.removeGitIgnoreFile();
  }

  private async gitClone() {
    this.logger.debug(`${ ColorService.blue('[DEBUG] clone') } ${ this.remote } git repository to ${ this.local }...`);
    return new Promise<void>((resolve, reject) =>
      exec(`git clone ${ this.remote } ${ this.local }`, (error: Error) => {
        if (error !== undefined && error !== null) {
          reject();
        } else {
          this.logger.debug(`${ ColorService.blue('[DEBUG] clone') } success`);
          resolve();
        }
      }));
  }

  private async removeGitFolder() {
    const gitFolderPath: string = path.resolve(this.local, '.git');
    this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } ${ gitFolderPath } folder...`);
    await FileSystemUtils.rmdir(gitFolderPath);
    this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } success`);
  }

  private async removeGitIgnoreFile() {
    const gitIgnorePath: string = path.resolve(this.local, '.gitignore');
    this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } ${ gitIgnorePath } file...`);
    await FileSystemUtils.rm(gitIgnorePath);
    this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } success`);
  }

}
