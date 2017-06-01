import {Repository} from '../../common/interfaces/repository.interface';

export class GitRepository implements Repository {
  constructor(private _remote: string, private _destination: string) {}

  public clone(): Promise<void> {
    throw new Error('Not yet implemented');
  }
}
