import { Runner, RunnerFactory } from '../runners/index.js';
import { PnpmRunner } from '../runners/pnpm.runner.js';
import { AbstractPackageManager } from './abstract.package-manager.js';
import { PackageManager } from './package-manager.js';
import { PackageManagerCommands } from './package-manager-commands.js';

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
      install: 'install --strict-peer-dependencies=false',
      add: 'install --strict-peer-dependencies=false',
      update: 'update',
      remove: 'uninstall',
      saveFlag: '--save',
      saveDevFlag: '--save-dev',
      silentFlag: '--reporter=silent',
    };
  }
}
