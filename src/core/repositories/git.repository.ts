import {Repository} from '../../common/interfaces/repository.interface';
import * as git from 'nodegit';
import * as path from 'path';
import {FileSytemUtils} from '../utils/file-system.utils';

export class GitRepository implements Repository {
  constructor(private _remote: string, private _destination: string) {}

  public clone(): Promise<void> {
    return git.Clone(this._remote, this._destination, {})
      .then(() => FileSytemUtils.rmdir(path.join(this._destination, '.git')));
  }
}
