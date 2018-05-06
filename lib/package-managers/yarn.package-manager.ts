import * as ora from 'ora';
import chalk from 'chalk';
import { AbstractPackageManager } from './abstract.package-manager';
import { RunnerFactory, Runner } from '../runners';
import { PackageManager } from './package-manager';
import { messages } from '../ui';
import { PackageManagerLogger } from './package-manager.logger';

export class YarnPackageManager extends AbstractPackageManager {
  constructor(logger: PackageManagerLogger) {
    super(RunnerFactory.create(Runner.YARN, logger), logger);
  }

  public get name() {
    return PackageManager.YARN.toUpperCase();
  }
}
