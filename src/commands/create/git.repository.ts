import { exec } from 'child_process';
import * as path from 'path';
import { Logger, LoggerService } from '../../logger/logger.service';
import { ColorService } from '../../logger/color.service';
import { FileSystemUtils } from '../../utils/file-system.utils';

export class GitRepository {
  constructor(
    private logger: Logger = LoggerService.getLogger()
  ) {}

  public async clone(remote: string, local: string): Promise<void> {
    await this.gitClone(remote, local);
    await this.removeGitFolder(local);
    await this.removeGitIgnoreFile(local);
    await this.listCreatedFiles(local);
  }

  private async gitClone(remote: string, local: string) {
    this.logger.debug(`${ ColorService.blue('[DEBUG] clone') } ${ remote } git repository to ${ local }...`);
    return new Promise<void>((resolve, reject) =>
      exec(`git clone ${ remote } ${ local }`, (error: Error) => {
        if (error !== undefined && error !== null) {
          reject();
        } else {
          this.logger.debug(`${ ColorService.blue('[DEBUG] clone') } success`);
          resolve();
        }
      }));
  }

  private async removeGitFolder(local: string) {
    const gitFolderPath: string = path.resolve(local, '.git');
    this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } ${ gitFolderPath } folder...`);
    await FileSystemUtils.rmdir(gitFolderPath);
    this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } success`);
  }

  private async removeGitIgnoreFile(local: string) {
    const gitIgnorePath: string = path.resolve(local, '.gitignore');
    this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } ${ gitIgnorePath } file...`);
    await FileSystemUtils.rm(gitIgnorePath);
    this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } success`);
  }

  private async listCreatedFiles(local: string) {
    const files: string[] = await FileSystemUtils.readdir(path.join(process.cwd(), local));
    files.forEach((file) => this.logger.info(ColorService.green('create'), file));
  }
}
