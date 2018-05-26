import { AbstractPackageManager } from './abstract.package-manager';
import { RunnerFactory, Runner } from '../runners';
import { PackageManager } from './package-manager';
import { messages } from '../ui';
import {PackageManagerCommands} from "./package-manager-commands";

export class YarnPackageManager extends AbstractPackageManager {

  constructor() {
    super(RunnerFactory.create(Runner.YARN));
  }

  public get name() {
    return PackageManager.YARN.toUpperCase();
  }

  get cli(): PackageManagerCommands {
    return {
      install: 'install',
      add: 'add',
      update: 'upgrade',
      remove: 'remove',
      saveFlag: '',
      saveDevFlag: '-D',
    };
  }

}
