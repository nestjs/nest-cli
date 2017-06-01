import {Repository} from '../../common/interfaces/repository.interface';
import {GitUtils} from '../utils/git.utils';
import {FileSytemUtils} from '../utils/file-system.utils';
import * as path from 'path';
import {Logger} from '../../common/interfaces/logger.interface';
import {LoggerService} from '../loggers/logger.service';

export class GitRepository implements Repository {
  private logger: Logger = LoggerService.getLogger();

  constructor(private _remote: string, private _destination: string) {}

  public clone(): Promise<void> {
    //this.logger.debug(`${ ColorService.yellow('clone') } ${ this._remote } git repository to ${ this._destination }...`);
    return GitUtils.clone(this._remote, this._destination)
      //.then(() => this.logger.debug(`${ ColorService.yellow('clone') } success`))
      //.then(() => this.logger.debug(`${ ColorService.yellow('delete') } ${ path.join(this._destination, '.git') } folder`))
      .then(() => FileSytemUtils.rmdir(path.join(this._destination, '.git')))
      //.then(() => this.logger.debug(`${ ColorService.yellow('delete') } success`));
  }
}
