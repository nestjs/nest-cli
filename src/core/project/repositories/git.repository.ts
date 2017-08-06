import {Repository} from '../../../common/project/interfaces/repository.interface';
import {GitUtils} from '../../utils/git.utils';
import {FileSystemUtils} from '../../utils/file-system.utils';
import * as path from 'path';
import {Logger} from '../../../common/logger/interfaces/logger.interface';
import {LoggerService} from '../../logger/logger.service';
import {ColorService} from '../../logger/color.service';

export class GitRepository implements Repository {
  private logger: Logger = LoggerService.getLogger();

  constructor(private _remote: string, private _destination: string) {}

  public clone(): Promise<void> {
    this.logger.debug(`${ ColorService.blue('[DEBUG] clone') } ${ this._remote } git repository to ${ this._destination }...`);
    return GitUtils.clone(this._remote, this._destination)
      .then(() => this.logger.debug(`${ ColorService.blue('[DEBUG] clone') } success`))
      .then(() => this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } ${ path.join(this._destination, '.git') } folder...`))
      .then(() => FileSystemUtils.rmdir(path.join(this._destination, '.git')))
      .then(() => this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } success`))
      .then(() => this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } ${ path.join(this._destination, '.gitignore') } file...`))
      .then(() => FileSystemUtils.rm(path.join(this._destination, '.gitignore')))
      .then(() => this.logger.debug(`${ ColorService.blue('[DEBUG] delete') } success`));
  }
}
