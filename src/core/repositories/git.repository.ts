import {Repository} from '../../common/interfaces/repository.interface';
import {GitUtils} from '../utils/git.utils';
import {FileSytemUtils} from '../utils/file-system.utils';
import * as path from 'path';

export class GitRepository implements Repository {
  constructor(private _remote: string, private _destination: string) {}

  public clone(): Promise<void> {
    return GitUtils.clone(this._remote, this._destination)
      .then(() => FileSytemUtils.rmdir(path.join(this._destination, '.git')));
  }
}
