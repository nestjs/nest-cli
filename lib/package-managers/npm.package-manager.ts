import * as ora from 'ora';
import chalk from 'chalk';
import { AbstractPackageManager } from './abstract.package-manager';
import { RunnerFactory, Runner } from '../runners';
import { PackageManager } from './package-manager';
import { messages } from '../ui';
import { PackageManagerLogger } from './package-manager.logger';

export class NpmPackageManager extends AbstractPackageManager {
  constructor(logger: PackageManagerLogger) {
    super(RunnerFactory.create(Runner.NPM, logger), logger);
  }

  public get name() {
    return PackageManager.NPM.toUpperCase();
  }
}
