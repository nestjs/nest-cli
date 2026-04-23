import { Runner, RunnerFactory } from '../runners/index.js';
import { BunRunner } from '../runners/bun.runner.js';
import { AbstractPackageManager } from './abstract.package-manager.js';
import { PackageManager } from './package-manager.js';
import { PackageManagerCommands } from './package-manager-commands.js';

export class BunPackageManager extends AbstractPackageManager {
  constructor() {
    super(RunnerFactory.create(Runner.BUN) as BunRunner);
  }

  public get name() {
    return PackageManager.BUN.toUpperCase();
  }

  get cli(): PackageManagerCommands {
    return {
      install: 'install',
      add: 'add',
      update: 'update',
      remove: 'remove',
      saveFlag: '--save',
      saveDevFlag: '--dev',
      silentFlag: '--silent',
    };
  }
}
