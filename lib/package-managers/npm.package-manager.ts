import { AbstractPackageManager } from './abstract.package-manager';
import { RunnerFactory, Runner } from '../runners';
import { PackageManager } from './package-manager';
import {PackageManagerCommands} from "./package-manager-commands";

export class NpmPackageManager extends AbstractPackageManager {
  constructor() {
    super(RunnerFactory.create(Runner.NPM));
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
    };
  }
}
