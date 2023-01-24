import { Runner, RunnerFactory } from '../runners';
import { NpmRunner } from '../runners/npm.runner';
import { AbstractPackageManager } from './abstract.package-manager';
import { PackageManager } from './package-manager';
import { PackageManagerCommands } from './package-manager-commands';

export class NpmPackageManager extends AbstractPackageManager {
  constructor() {
    super(RunnerFactory.create(Runner.NPM) as NpmRunner);
  }

  public get name() {
    return PackageManager.NPM.toUpperCase();
  }

  get cli(): PackageManagerCommands {
    return {
      install: 'install',
      add: 'install',
      update: 'update',
      remove: 'uninstall',
      saveFlag: '--save',
      saveDevFlag: '--save-dev',
      silentFlag: '--silent',
    };
  }
}
