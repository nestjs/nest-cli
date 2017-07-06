import {NpmUtils} from '../../utils/npm.utils';

export class PackageJsonUpdater {
  constructor() {}

  public update(): Promise<void> {
    return NpmUtils.update();
  }
}
