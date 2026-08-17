import { Runner, RunnerFactory } from '../runners/index.js';
import { NpmRunner } from '../runners/npm.runner.js';
import { AbstractPackageManager } from './abstract.package-manager.js';
import { PackageManager } from './package-manager.js';
import { PackageManagerCommands } from './package-manager-commands.js';

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
