import { Runner, RunnerFactory } from '../runners';
import { PnpmRunner } from '../runners/pnpm.runner';
import { AbstractPackageManager } from './abstract.package-manager';
import { PackageManager } from './package-manager';
import { PackageManagerCommands } from './package-manager-commands';

export class PnpmPackageManager extends AbstractPackageManager {
  constructor() {
    super(RunnerFactory.create(Runner.PNPM) as PnpmRunner);
  }

  public get name() {
    return PackageManager.PNPM.toUpperCase();
  }

  // As of PNPM v5.3, all commands are shared with NPM v6.14.5. See: https://pnpm.js.org/en/pnpm-vs-npm
  get cli(): PackageManagerCommands {
    return {
      install: 'install',
      add: 'install',
      update: 'update',
      remove: 'uninstall',
      saveFlag: '--save',
      saveDevFlag: '--save-dev',
      silentFlag: '--reporter=silent',
    };
  }
}
