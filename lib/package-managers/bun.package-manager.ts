import { Runner, RunnerFactory } from '../runners';
import { BunRunner } from '../runners/bun.runner';
import { AbstractPackageManager } from './abstract.package-manager';
import { PackageManager } from './package-manager';
import { PackageManagerCommands } from './package-manager-commands';

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
      saveFlag: '',
      saveDevFlag: '--development',
      silentFlag: '--silent',
    };
  }
}