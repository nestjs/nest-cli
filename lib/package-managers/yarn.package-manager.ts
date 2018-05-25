import { Runner, RunnerFactory } from '../runners';
import { YarnRunner } from '../runners/yarn.runner';
import { AbstractPackageManager } from './abstract.package-manager';
import { PackageManager } from './package-manager';

export class YarnPackageManager extends AbstractPackageManager {
  constructor() {
    super(RunnerFactory.create(Runner.YARN) as YarnRunner);
  }

  public get name() {
    return PackageManager.YARN.toUpperCase();
  }
}
